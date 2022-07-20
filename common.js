
function on_event(eventtype,selector, callback){
	load_common_scripts_if_needed()

	document.querySelector(selector).removeEventListener(eventtype,console.log)
	document.querySelector(selector).addEventListener(eventtype,function(event){eval(callback)})	


}


function getDemoID(){
	return fetch('/demoID.txt').then(function (response) {
		return response.text();
	}).then(function (txt) {
		return txt
	})
}

function current_access_token_exists(){
	return 	window.localStorage.getItem('supabase.auth.token') ? JSON.parse(window.localStorage.getItem('supabase.auth.token'))['currentSession']['access_token'] : false
}

function user_details(){
	return supabase.auth.user()
}

function user_mail(){
	return user_details() ? user_details()['email'] : 'demo@amazonbestsellers.org'
}

function user_meta_datas(){
	return   user_details() ? user_details()['user_metadata'] : {}
}

function user_data(dataName){
	return user_meta_datas() ? (user_meta_datas()[dataName] || "") : ""
}

async function logout(){
	const { error } = await supabase.auth.signOut()
	setTimeout(function(){window.location.assign('/')},1000)
}

async function who_is_connected(){
	me = user_details()

	return me ? me['id'] : await getDemoID()
}


function load_common_scripts_if_needed(callback){

	links_src = ['https://code.jquery.com/jquery-3.6.0.slim.min.js']

	for (const link of links_src){

		if(!document.querySelector('[src="'+link+'"]')){

			var script = document.createElement('script')
			script.src = link
			script.crossorigin = 'anonymous'

			document.head.appendChild(script)
		}	

	}

	if(callback) callback()
}
