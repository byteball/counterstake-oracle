const base64url = require('base64url');


function parseWalletUrl(url){

	const network = url.split(':')[0]
	const recipient = url.split(':')[1].split('?')[0]
	const amount = Number(url.split(':')[1].split('?')[1].split('&')[0].replace('amount=',''))
	const data = JSON.parse(base64url.decode(url.split(':')[1].split('?')[1].split('&')[1].replace('base64data=','')))

	return {network, recipient, amount, data}
}


module.exports = {
	parseWalletUrl
}
