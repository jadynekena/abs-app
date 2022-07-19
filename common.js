
function getDemoID(){
	return fetch('/demoID.txt').then(function (response) {
		return response.text();
	}).then(function (txt) {
		return txt
	})
}


async function who_is_connected(){
	me = supabase.auth.user()

	return me ? me['id'] : await getDemoID()
}