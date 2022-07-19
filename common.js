
function getDemoID(){
	return fetch('/demoID.txt').then(function (response) {
		return response.text();
	}).then(function (txt) {
		return txt
	})
}