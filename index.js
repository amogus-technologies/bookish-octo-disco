require('ts-node').createEsmHooks(require('ts-node').register());if(require('./src/App').App.main(process.argv.slice(2)))throw new Error('App exited with error');