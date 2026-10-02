const os = require('node:os');
const originalUserInfo = os.userInfo.bind(os);

os.userInfo = (...args) => {
  try {
    return originalUserInfo(...args);
  } catch (error) {
    if (error?.syscall !== 'uv_os_get_passwd') throw error;
    return {
      username: process.env.USERNAME || 'elabel-dev',
      uid: -1,
      gid: -1,
      shell: null,
      homedir: os.homedir(),
    };
  }
};
