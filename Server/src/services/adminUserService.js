/**
 * Admin User Service
 * Handles all user management operations for admin
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get all users with filtering and pagination
 */
const getAllUsers = async (filters = {}, pagination = {}) => {
  try {
    const {
      role = null,
      status = null,
      search = null,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = filters;

    const {
      page = 1,
      limit = 20
    } = pagination;

    let query = supabase
      .from('user_roles')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false);

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (status) {
      query = query.eq('account_status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Fetch additional user info from auth.users
    const userIds = data.map(u => u.user_id);
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .in('id', userIds);

    if (authError) throw authError;

    // Merge data
    const users = data.map(userRole => {
      const authUser = authUsers.find(u => u.id === userRole.user_id);
      return {
        id: userRole.user_id,
        email: authUser?.email,
        role: userRole.role,
        account_status: userRole.account_status,
        registration_date: authUser?.created_at,
        created_at: userRole.created_at
      };
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Get user by ID with all details
 */
const getUserById = async (userId) => {
  try {
    // Get user role info
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (roleError) throw roleError;

    // Get auth user info
    const { data: authUser, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('id', userId)
      .single();

    if (authError) throw authError;

    // Get additional info based on role
    let additionalInfo = {};

    if (userRole.role === 'Doctor') {
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!doctorError && doctor) {
        additionalInfo = {
          full_name: doctor.full_name,
          phone_number: doctor.phone_number,
          specialty: doctor.specialty,
          is_approved: doctor.is_approved,
          is_approved_by_admin: doctor.is_approved_by_admin
        };

        // Get specialization
        const { data: spec, error: specError } = await supabase
          .from('doctor_specializations')
          .select('specialization_id, medical_specializations(id, name)')
          .eq('doctor_id', userId)
          .single();

        if (!specError && spec) {
          additionalInfo.specialization = spec.medical_specializations;
        }

        // Get schedule
        const { data: schedule, error: scheduleError } = await supabase
          .from('doctor_availability')
          .select('*')
          .eq('doctor_id', userId);

        if (!scheduleError && schedule) {
          additionalInfo.schedule = schedule;
        }
      }
    } else if (userRole.role === 'Patient') {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!patientError && patient) {
        additionalInfo = {
          full_name: patient.full_name,
          phone_number: patient.phone_number,
          age: patient.age,
          blood_type: patient.blood_type
        };
      }
    }

    return {
      id: userRole.user_id,
      email: authUser.email,
      role: userRole.role,
      account_status: userRole.account_status,
      registration_date: authUser.created_at,
      ...additionalInfo
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

/**
 * Update user account status (activate/deactivate)
 */
const updateUserStatus = async (userId, newStatus, adminId) => {
  try {
    // Validate status
    const validStatuses = ['Active', 'Inactive', 'Pending Approval'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid account status');
    }

    // Update user status
    const { data, error } = await supabase
      .from('user_roles')
      .update({ account_status: newStatus })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log audit action
    await supabase
      .from('audit_logs')
      .insert({
        admin_id: adminId,
        action_type: newStatus === 'Active' ? 'ACTIVATE' : 'DEACTIVATE',
        resource_type: 'Account',
        resource_id: userId,
        changes: { account_status: { from: data.account_status, to: newStatus } },
        status: 'Success'
      });

    return data;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

/**
 * Approve doctor registration
 */
const approveDoctorRegistration = async (doctorId, specializationId, adminId) => {
  try {
    // Validate specialization exists
    const { data: spec, error: specError } = await supabase
      .from('medical_specializations')
      .select('id')
      .eq('id', specializationId)
      .single();

    if (specError || !spec) {
      throw new Error('Specialization not found');
    }

    // Update doctor approval status
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .update({
        is_approved_by_admin: true,
        admin_approval_date: new Date().toISOString()
      })
      .eq('user_id', doctorId)
      .select()
      .single();

    if (doctorError) throw doctorError;

    // Assign specialization
    const { error: specAssignError } = await supabase
      .from('doctor_specializations')
      .insert({
        doctor_id: doctorId,
        specialization_id: specializationId,
        assigned_by: adminId
      });

    if (specAssignError) throw specAssignError;

    // Update user role status to Active
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .update({ account_status: 'Active' })
      .eq('user_id', doctorId)
      .select()
      .single();

    if (roleError) throw roleError;

    // Log audit action
    await supabase
      .from('audit_logs')
      .insert({
        admin_id: adminId,
        action_type: 'APPROVE',
        resource_type: 'Doctor',
        resource_id: doctorId,
        changes: {
          is_approved_by_admin: true,
          specialization_id: specializationId,
          account_status: 'Active'
        },
        status: 'Success'
      });

    return userRole;
  } catch (error) {
    console.error('Error approving doctor:', error);
    throw error;
  }
};

/**
 * Reject doctor registration
 */
const rejectDoctorRegistration = async (doctorId, reason, adminId) => {
  try {
    // Soft delete the user
    const { error: deleteError } = await supabase
      .from('user_roles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('user_id', doctorId);

    if (deleteError) throw deleteError;

    // Log audit action
    await supabase
      .from('audit_logs')
      .insert({
        admin_id: adminId,
        action_type: 'REJECT',
        resource_type: 'Doctor',
        resource_id: doctorId,
        changes: { reason },
        status: 'Success'
      });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    throw error;
  }
};

/**
 * Assign specialization to doctor
 */
const assignSpecializationToDoctor = async (doctorId, specializationId, adminId) => {
  try {
    // Check if specialization exists
    const { data: spec, error: specError } = await supabase
      .from('medical_specializations')
      .select('id, name')
      .eq('id', specializationId)
      .single();

    if (specError || !spec) {
      throw new Error('Specialization not found');
    }

    // Check if doctor already has this specialization
    const { data: existing } = await supabase
      .from('doctor_specializations')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('specialization_id', specializationId)
      .single();

    if (existing) {
      throw new Error('Doctor already has this specialization');
    }

    // Assign specialization
    const { data, error } = await supabase
      .from('doctor_specializations')
      .insert({
        doctor_id: doctorId,
        specialization_id: specializationId,
        assigned_by: adminId
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit action
    await supabase
      .from('audit_logs')
      .insert({
        admin_id: adminId,
        action_type: 'UPDATE',
        resource_type: 'Doctor',
        resource_id: doctorId,
        changes: { specialization_id: specializationId },
        status: 'Success'
      });

    return {
      doctor_id: doctorId,
      specialization: spec
    };
  } catch (error) {
    console.error('Error assigning specialization:', error);
    throw error;
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  approveDoctorRegistration,
  rejectDoctorRegistration,
  assignSpecializationToDoctor
};
