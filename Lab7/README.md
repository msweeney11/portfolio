GET Routes
/greet/ — Welcome message showing User-Agent header and visit cookie if present 
/check-auth/ — Check for auth_token header and session_id cookie to verify authentication 
/track/ — Return all request headers and cookies for inspection or debugging

POST Routes
/set-cookie/ — Set a visit cookie with value "first_time" and 1-hour expiration

PUT Routes
/update-preferences/ — Update user preferences using preference header and theme cookie
