
function on_event(eventtype,selector, callback){
	load_common_scripts_if_needed()

	document.querySelector(selector).removeEventListener(eventtype,console.log)
	document.querySelector(selector).addEventListener(eventtype,function(event){eval(callback)})	


}

function main_common(){
	url_referrer_in_heads() //always send referrer
	document.addEventListener("DOMContentLoaded", function(){
		setTimeout(function(){
			send_my_details()
		}, 1000)
	})
	
	
}

async function user_niveau(){
	return user_data('id_niveau') || await free_niveau()
}

async function send_my_details(forcing){
	adresse_ip = await myIP()
	id_user =  await who_is_connected()
	id_niveau =  await  user_niveau()
	my_details = {
		adresse_ip:  adresse_ip,
		nom: user_data('nom'),
		liste_departements: user_data('liste_departements'),
		id_user: id_user,
		id_niveau: id_niveau,
	}

	if(forcing || (window.location.pathname !== '/' && !currently_local_host() && all_keys_have_value(my_details))){
		send_all(my_details)
	}

	return my_details
}

function all_keys_have_value(my_details){
	var keyname = ''
	keyname = Object.keys(my_details).find(function(key){
		return my_details[key] === ''
	})

	return keyname && keyname.length === 0
}

function currently_local_host(){
	return window.location.href.includes('localhost:')
}

main_common()

async function send_all(my_details){
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	return  await supabase_local.from('historique').insert(my_details)	

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


function current_access_token_exists(){
	return 	window.localStorage.getItem('supabase.auth.token') ? JSON.parse(window.localStorage.getItem('supabase.auth.token'))['currentSession']['access_token'] : false
}

function user_details(){
	return supabase &&  supabase.auth ? supabase.auth.user() : {}
}

function user_mail(){
	return user_details() && Object.keys(user_details()).length > 0 ? user_details()['email'] : 'demo@amazonbestsellers.org'
}

function user_meta_datas(){
	return  user_details() && Object.keys(user_details()).length > 0 ? user_details()['user_metadata'] : {}
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

	return (local_val && local_val.length > 0) ? local_val.trim()
			: (Object.keys(user_meta_datas()).length > 0 && user_meta_datas()[dataName]) ? user_meta_datas()[dataName].trim()
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

function is_demo(){
	return user_mail() === 'demo@amazonbestsellers.org'
}

async function free_niveau(){	
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	res = await supabase_local.from('niveaux').select('id_niveau').eq('etiquette_niveau','FREE')
	return res && res.data && res.data[0] ? res.data[0]['id_niveau'] : ""
}

async function who_is_connected(){
	me = user_details()

	return me ? me['id'] : await get_content('/demoID.txt')
}


function load_common_scripts_if_needed(callback){

	links_src = ['https://code.jquery.com/jquery-3.6.0.slim.min.js']

	if(currently_local_host()) links_src.push('https://livejs.com/live.js')

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

function current_top_url(){
	try{
		res = window.top.location.href 

	}catch(err){
		console.error(err)
		res = document.referrer
	}
	//console.log("TOP URL = " + res)
	return res
}

function url_referrer_in_heads(){
	//todo : { Current-URL: current_top_url() }
}

function inIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}