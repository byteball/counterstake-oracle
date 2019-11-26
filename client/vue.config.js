module.exports = {
	devServer: {
		proxy: process.env.local_server ? 'http://127.0.0.1:3000/' : '',
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
