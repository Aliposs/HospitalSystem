/**
 * Admin Dashboard Service
 * Handles dashboard statistics and monitoring
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get user statistics
 */
const getUserStatistics = async () => {
  try {
    // Get total users by role
    const { data: usersByRole } = await supabase
      .from('user_roles')
      .select('role', { count: 'exact' })
      .eq('is_deleted', false);

    // Get users by status
    const { data: usersByStatus } = await supabase
      .from('user_roles')
      .select('account_status', { count: 'exact' })
      .eq('is_deleted', false);

    // Count total
    const { count: totalUsers } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false);

    // Group by role
    const byRole = {};
    usersByRole?.forEach(item => {
      byRole[item.role] = (byRole[item.role] || 0) + 1;
    });

    // Group by status
    const byStatus = {};
    usersByStatus?.forEach(item => {
      byStatus[item.account_status] = (byStatus[item.account_status] || 0) + 1;
    });

    return {
      total: totalUsers || 0,
      by_role: byRole,
      by_status: byStatus
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw error;
  }
};

/**
 * Get medical cases statistics
 */
const getCaseStatistics = async () => {
  try {
    // Get total appointments
    const { count: totalCases } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' });

    // Get appointments by status
    const { data: casesByStatus } = await supabase
      .from('appointments')
      .select('status', { count: 'exact' });

    // Get appointments by specialization
    const { data: casesBySpec } = await supabase
      .from('appointments')
      .select('doctor_id')
      .then(async (result) => {
        if (result.error) throw result.error;
        
        // Get doctor specializations
        const doctorIds = result.data.map(a => a.doctor_id);
        const { data: specs } = await supabase
          .from('doctor_specializations')
          .select('doctor_id, medical_specializations(name)')
          .in('doctor_id', doctorIds);

        return specs;
      });

    // Group by status
    const byStatus = {};
    casesByStatus?.forEach(item => {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    });

    // Group by specialization
    const bySpecialization = {};
    casesBySpec?.forEach(item => {
      const specName = item.medical_specializations?.name || 'Unknown';
      bySpecialization[specName] = (bySpecialization[specName] || 0) + 1;
    });

    return {
      total: totalCases || 0,
      by_status: byStatus,
      by_specialization: bySpecialization
    };
  } catch (error) {
    console.error('Error getting case statistics:', error);
    throw error;
  }
};

/**
 * Get lab test statistics
 */
const getLabTestStatistics = async () => {
  try {
    // Get total lab tests (from lab_history)
    const { count: totalTests } = await supabase
      .from('lab_history')
      .select('*', { count: 'exact' });

    // For now, we'll return basic stats
    // You can extend this based on your lab_history table structure
    return {
      total: totalTests || 0,
      by_status: {
        'Pending': 0,
        'Completed': totalTests || 0,
        'Cancelled': 0
      },
      by_lab: {}
    };
  } catch (error) {
    console.error('Error getting lab test statistics:', error);
    throw error;
  }
};

/**
 * Get all dashboard statistics
 */
const getAllStatistics = async () => {
  try {
    const [userStats, caseStats, labStats] = await Promise.all([
      getUserStatistics(),
      getCaseStatistics(),
      getLabTestStatistics()
    ]);

    return {
      users: userStats,
      cases: caseStats,
      lab_tests: labStats,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting all statistics:', error);
    throw error;
  }
};

/**
 * Get cached statistics (if available)
 */
const getCachedStatistics = async (cacheKey) => {
  try {
    const { data, error } = await supabase
      .from('dashboard_cache')
      .select('cache_value, expires_at')
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) return null;

    // Check if cache is expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired cache
      await supabase
        .from('dashboard_cache')
        .delete()
        .eq('cache_key', cacheKey);
      return null;
    }

    return data.cache_value;
  } catch (error) {
    console.error('Error getting cached statistics:', error);
    return null;
  }
};

/**
 * Cache statistics
 */
const cacheStatistics = async (cacheKey, data, ttlMinutes = 5) => {
  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Delete old cache if exists
    await supabase
      .from('dashboard_cache')
      .delete()
      .eq('cache_key', cacheKey);

    // Insert new cache
    const { error } = await supabase
      .from('dashboard_cache')
      .insert({
        cache_key: cacheKey,
        cache_value: data,
        expires_at: expiresAt.toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error caching statistics:', error);
    // Don't throw - caching failure shouldn't break the app
  }
};

module.exports = {
  getUserStatistics,
  getCaseStatistics,
  getLabTestStatistics,
  getAllStatistics,
  getCachedStatistics,
  cacheStatistics
};
