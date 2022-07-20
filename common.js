
function on_event(eventtype,selector, callback){
	load_common_scripts_if_needed()

	document.querySelector(selector).removeEventListener(eventtype,console.log)
	document.querySelector(selector).addEventListener(eventtype,function(event){eval(callback)})	


}

function main_common(){
	document.addEventListener("DOMContentLoaded", send_my_IP)
}

main_common()

async function send_my_IP(){
	if(supabase){
		try{
			return  await supabase.from('demos').insert({adresse_ip:  await myIP() })	
		}catch(e){
			console.warn(e)
		}
		
	}
}

async function send_my_name(){
	if(supabase){
		try{
			return await supabase.from('demos')
						  .update({nom: user_data('nom')})
						  .match({adresse_ip:  await myIP() })	
		}catch(e){
			console.warn(e)
		}
		
	}
}

async function myIP(){
	adresse_ip = window.localStorage.getItem('adresse_ip') || await get_content('https://ipapi.co/ip/')
	window.localStorage.setItem('adresse_ip',adresse_ip)
	return adresse_ip
}

async function get_content(url){
	return await fetch(url).then(function (response) {
		return response.text();
	}).then(function (txt) {
		return txt
	})
}

function loading(yes){
	document.querySelector('.loading').style.display = yes ? 'block' : 'none'
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
	return supabase ? supabase.auth.user() : {}
}

function user_mail(){
	return user_details() && user_details().length > 0 ? user_details()['email'] : 'demo@amazonbestsellers.org'
}

function user_meta_datas(){
	return  user_details() && user_details().length > 0 ? user_details()['user_metadata'] : {}
}

function user_data(dataName){
	local_val = window.localStorage.getItem(dataName)

	if(local_val !== null && local_val !== undefined){

		if(local_val.includes('{')) local_val = JSON.parse(local_val)

	}else{
		local_val = ""
	}
	/*
	console.log({[dataName]: local_val})	
	*/

	return (local_val && local_val.length > 0) ? local_val 
			: (user_meta_datas().length > 0 && user_meta_datas()[dataName]) ? user_meta_datas()[dataName] 
			: ""
}



async function logout(){
	try{
		const { error } = await supabase.auth.signOut()	
	}catch(e){
		console.log(e)
	}
	
	window.localStorage.clear()
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
