const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      console.log('Verifying token...');
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error('Token verification failed:', error);
        
        // Handle expired token specifically
        if (error?.message?.includes('expired')) {
          return res.status(401).json({ 
            success: false, 
            message: 'Token expired. Please login again.',
            code: 'TOKEN_EXPIRED'
          });
        }
        
        return res.status(401).json({ 
          success: false, 
          message: 'Not authorized, token invalid' 
        });
      }
      
      console.log('User authenticated:', user.id);
      
      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }
      
      req.user = {
        id: user.id,
        email: user.email,
        ...profile
      };
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  } else {
    console.log('No token provided');
    res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token' 
    });
  }
};

module.exports = { protect };