// config/redisNamespace.js

const getNamespace = () => {
  let namespace = '';

  // Logic for determining namespace
  if (typeof window !== 'undefined') {
    const hostName = window.location.hostname;

    if (hostName.includes('tqrtoken.net')) {
      if (hostName.includes('tensor')) {
        namespace = hostName.includes('lab') ? 'yy:tensor' : 'tensor';
      } else {
        const countryCode = hostName.includes('-')
          ? hostName.split('-')[0]
          : hostName.slice(0, 2);
        namespace = `${countryCode}:tensor`;
      }
    }
  } else {
    // Server-side or CLI logic
    const hostName = process.env.HOSTNAME || 'localhost';

    // Synonym: treat 'DESKTOP-55SQIHT' as '19'
    if (hostName === 'DESKTOP-55SQIHT') {
      console.log('PC detected, dev box.');
      namespace = '19:tensor';
    } else if (hostName.includes('tensor-lab')) {
      console.log('CLI Test environment detected, using "yy" namespace.');
      namespace = 'yy:tensor';
    } else if (hostName.includes('tensor')) {
      console.log('CLI Production detected, using "tensor" namespace.');
      namespace = 'tensor';
    } else {
      console.error('Unrecognized environment, defaulting to global namespace.');
      namespace = 'global:tensor';
    }
  }

  return namespace;
};


module.exports = { getNamespace };
