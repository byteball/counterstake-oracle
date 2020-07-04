const LOCAL_BACKEND_URL = process.env.VUE_APP_TESTNET ? 'http://127.0.0.1:1300/' : 'http://127.0.0.1:1400/';
const REMOTE_BACKEND_URL = process.env.VUE_APP_TESTNET ? 'https://testnet.counterstake.org/' : 'https://counterstake.org/';

module.exports = {
	devServer: {
		proxy: {
			"^/api/pairs" : { 
				target: process.env.VUE_APP_TESTNET ? 'https://testnet.odex.ooo/' : 'https://odex.ooo/' 
			},
			"^/api" : { 
				target: process.env.VUE_APP_LOCAL_SERVER ? LOCAL_BACKEND_URL : REMOTE_BACKEND_URL
			}
		}
		
	},
	configureWebpack: {

	},
	pluginOptions: {
		i18n: {
			locale: 'en',
			fallbackLocale: 'en',
			localeDir: 'locales',
			enableInSFC: false
		}
	}
}
