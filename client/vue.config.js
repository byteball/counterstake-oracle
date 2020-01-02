module.exports = {
	devServer: {
		proxy: process.env.local_server ? 'http://127.0.0.1:1300/' : 'https://counterstake.org/',
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
