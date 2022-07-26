const SUPABASE_URL = "https://ojfpzzbgxyrtwmqolqwa.supabase.co"
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZnB6emJneHlydHdtcW9scXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTc1MTU2OTMsImV4cCI6MTk3MzA5MTY5M30.Cw-t8RhhDHs0vKA6Q-zpQRL5JrX9vMX5g9oThszCEC4'
const { createClient } = supabase
var supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SEPARATOR = ';';
const TIMER_TO_SHOW_BODY = 500;

var my_departments = user_data('liste_departements')
var myname =  user_data('nom')
var mymode = user_data('mode')
var selected_departement = ''



async function handle_enter(next_step_if_enter_str){
	//console.log('\n')
	//console.log(event.key)
	if(event.key === "Enter"){
		eval(next_step_if_enter_str)
	}else{

	}
}
function portrait(){
	return window.innerWidth <= window.innerHeight
}
function on_event(eventtype,selector, callback){
	load_common_scripts_if_needed()
	$(selector).off(eventtype)
	$(selector).on(eventtype,async function(event){
	 	eval(callback)
	})

}

function noclick(selector){
	document.querySelector(selector).removeEventListener('click',console.log)
}


function get_light(){
	return document.querySelector('html').className === '' ? 'jour' : 'nuit'
}


function main_common(){

	url_referrer_in_heads() //always send referrer
	//apply_light(user_data('mode'))
	document.addEventListener("DOMContentLoaded", function(){
		setTimeout(function(){
			send_my_details()
		}, 1000)
	})
	
	
}

function apply_light(mode){
	document.querySelector('html').className = mode === 'nuit' ? 'nuit' : ''
}

async function toggle_light(){

	document.querySelector('html').className = document.querySelector('html').className.includes('nuit') ? "" : "nuit"


	if(user_details() && Object.keys(user_details()).length > 0){
		mydatas = await save_my_datas(true)
	}else {
		window.localStorage.setItem('mode', get_light())
	}
	//console.log({mydatas})
}

async function send_my_details(forcing){
	my_details = await get_my_details()
	if(forcing || (window.location.pathname !== '/' && !currently_local_host() && all_keys_have_value(my_details))){
		send_all(my_details)
	}

	return my_details
}

async function get_my_details(){
	
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
 	
 	return my_details;
}

function all_keys_have_value(my_details){
	var keyname = ''
	keyname = Object.keys(my_details).find(function(key){
		return my_details[key] === ''
	})

	return keyname && keyname.length === 0
}

function currently_local_host(){
	return window.location.href.includes('localhost:') || window.location.host.includes('192.168.') || window.location.host.includes('127.0.0')
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

async function get_content(url,sync_mode){

	if(!sync_mode){

		return await fetch(url).then(function (response) {
			return response.text();
		}).then(function (txt) {
			return txt
		})
	}else{
		const request = new XMLHttpRequest();
		request.open('GET', url, false);  // `false` makes the request synchronous
		request.send(null);

		if (request.status === 200) {
			return request.responseText
		}
	}
}

async function post_content(URL, content){
	const requestOptions = {
	    method: 'POST',
	    headers: { 'Content-Type': 'application/json' },
	    body: JSON.stringify(content)
	};
	return await fetch(URL, requestOptions)
	    .then(response  => response.text())
}

async function call_function(function_name, parameters, JSONMODE){
	res = await post_content(SUPABASE_URL + '/rest/v1/rpc/' + function_name + '?apikey=' + SUPABASE_KEY,parameters)
	if(JSONMODE) res = JSON.parse(res)

	return res
}


function loading(yes){
	if(document.querySelector('.loading')){ document.querySelector('.loading').style.display = yes ? 'block' : 'none'}document.querySelector('html').style.cursor = yes ? 'progress' : ''
}


function current_access_token_exists(){
	return 	window.localStorage.getItem('supabase.auth.token') ? JSON.parse(window.localStorage.getItem('supabase.auth.token'))['currentSession']['access_token'] : false
}


function get_name_to_save(){
	return $('#nom').val() || user_data('nom') || 'Anonyme'
}

function get_deptmts_to_save(){
	//console.log({selected_departement})
	return my_selection() || selected_departement || user_data('liste_departements')
}

function get_nb_maj_to_save(){
	return user_data('nb_maj') || 0
}

async function get_id_niveau_to_save(){
	return $('#niveau').val() || user_niveau()
}


function my_selection(){
	return $('.one_select select:visible').get().map(e => e.value).join(SEPARATOR)
}


async function save_my_datas(lets_show_all,callback, dontsend_local_changes){
	//console.log({dontsend_local_changes})

	myname = get_name_to_save()
	my_departments = get_deptmts_to_save()
	mymode = get_light()
	nb_maj = get_nb_maj_to_save()
	id_niveau = await get_id_niveau_to_save()

	my_datas = {
		nom: myname,
		liste_departements: my_departments,
		mode: mymode,
		id_niveau: id_niveau
	} 

	if(dontsend_local_changes) delete my_datas['liste_departements']

	show_all(lets_show_all)

	
	if(user_details() && supabase){


		//check current credits
		//if max achieved : remove departments
		if(await enough_credits() === false){
			delete my_datas['liste_departements']
			//alert('Crédits insuffisants.')
		}  

		const { user, error } = await supabase.auth.update({ 
			data: my_datas
		})


	}else{

		window.localStorage.setItem('nom',myname)


		//check current credits
		//if max achieved : no change on departments
		if(await enough_credits()){
			window.localStorage.setItem('liste_departements',my_departments)
		}  

		window.localStorage.setItem('mode',mymode)

		
	}

	if(callback){
		eval(callback)	
	} 
	
	hist = await send_my_details(true)
	//console.log({hist})
	
	//{if(!dontsend_local_changes) update_html_view()}
	
	return my_datas

}




async function all_credits(){
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	me = await who_is_connected() ; 
	to_send = {
		'id_user_value':me,
	}

	if(is_demo()) to_send['adresse_ip_str'] = await myIP();


	let res = await call_function('credits',to_send,true) //this is text "{remain:0, max:0, used:0}"

	return res
}



async function user_credits(){
	
	var res = await all_credits()
	var remain = get_element_from_fake_json(res,'remain')
	var max = get_element_from_fake_json(res,'max')
	var used = get_element_from_fake_json(res,'used')
	
	return {remain:Number(remain),max:Number(max),used:Number(used)}
}



function get_element_from_fake_json(fake_json,prop_name){
	var res = ''
	var temp = fake_json.split(',').filter(e => e.includes(prop_name)).map(e => e.replace('{','').replace('}',''))
	if(temp){
		res = temp[0].split(':')[1]
	}

	return res
}

async function enough_credits(){	
	// if used = max ---> keep disabling confirm button
	const {used, max, remain} = await user_credits()
	if(used >= max) return false 

	return true
}

function show_all(yes){
	if(yes) return setTimeout(function(){apply_show(yes)}, TIMER_TO_SHOW_BODY/2)
	

	apply_show(yes)
}

function apply_show(yes){
	Array.from( document.querySelectorAll('.nav, .whole-body') ).forEach(e => e.style.display = yes ? '' : 'none' )
}

function user_details(){
	return supabase &&  supabase.auth ? supabase.auth.user() : {}
}

function user_mail(){
	return user_details() && Object.keys(user_details()).length > 0 ? user_details()['email'] : 'demo@amazonbestsellers.org'
}

function user_niveau(){
	return user_details() && Object.keys(user_details()).length > 0 ? user_data('id_niveau') : 'da438e17-83fd-4b88-bea4-fff93e640c3f' //free
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

	return (local_val && local_val.length > 0) && is_demo() ? local_val.trim()
			: (Object.keys(user_meta_datas()).length > 0 && user_meta_datas()[dataName]) ? user_meta_datas()[dataName].trim()
			: ""
}



async function logout(stay_here){
	try{
		const { error } = await supabase.auth.signOut()	
	}catch(e){
		console.log(e)
	}
	
	window.localStorage.clear()
	if(!stay_here) setTimeout(function(){window.location.assign('/')},1000)
}

function is_demo(){
	return user_mail() === 'demo@amazonbestsellers.org'
}

async function getDemoID(){
	res =  await supabase.from('users').select('id').eq('is_default',true).limit(1)
	return res.data && res.data[0] ? res.data[0]['id'] : await get_content('/demoID.txt',true)
}

async function free_niveau(){	
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	res = await supabase_local.from('niveaux').select('id_niveau').eq('etiquette_niveau','FREE')
	return res && res.data && res.data[0] ? res.data[0]['id_niveau'] : ""
}

async function who_is_connected(){
	me = user_details()

	return me ? me['id'] :  await get_content('/demoID.txt',true)
}


function load_common_scripts_if_needed(callback){

	links_src = [] //default already ok with 'https://code.jquery.com/jquery-3.6.0.slim.min.js'

	if(currently_local_host()) links_src.push('/live.js')
	if(portrait()) links_src.push('https://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.min.js')

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



	const {fetch: origFetch} = window;
	window.fetch = async (...args) => {
		//console.log("fetch called with args:", args);





		//only if we're on supabase
		if(args[0].includes(SUPABASE_URL)){

			loading(true)

			var headers_obj = new Headers();

			//if only 1 argument : create headers
			if(args.length === 1){
				headers_obj = {}

			//if 2 args : get current headers
			}else if(args.length === 2){
				headers_obj = args[1].headers ? args[1].headers : {}
			}

			if(headers_obj){
				//console.log({headers_obj})	
			}


			//add all new headers
			//headers_obj['Access-Control-Allow-Origin'] = '*'
			headers_obj['X-Current-Top-URL'] = current_top_url()
			headers_obj['X-Current-User'] =  await who_is_connected() 
			//headers_obj['mode'] = 'cors' //always cors

			//append new headers
			if(!args[1]) args[1] = {'headers': ''}
			args[1]['headers'] = headers_obj

			//always follow redirection
			/*args[1]['redirect'] = 'manual' // 'follow'*/

			//console.log(args)





		}




		const response = await origFetch(...args);


		/* work with the cloned response in a separate promise
		 chain -- could use the same chain with `await`. */
		response
		.clone()
		.json()
		.then(body => console.info('') /*console.log("intercepted response:", body)*/)
		.catch(err => {
			if(!response){
				console.error('\n\n\n\n------ERROR--------' ,err)	
			}else{
				//alert('error but we have this: ',response)
			}
		})
		;
	    
	  /* the original response can be resolved unmodified: */
	  loading(false)
	  return response;
	};











}

function inIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

async function my_amazon_datas(supabase){
	const res = await supabase.rpc('dernieres_donnees_cet_user',{id_user: await who_is_connected()}).csv()
	return res;
}

function download_locally(csv,final_name){
	var downloadLink = document.createElement("a");
	var blob = new Blob(["\ufeff", csv]);
	var url = URL.createObjectURL(blob);
	downloadLink.href = url;
	downloadLink.download = final_name + ".csv";
	downloadLink.click()
	downloadLink.remove()

}

function size_of_variable( object ) {

    var objectList = [];
    var stack = [ object ];
    var bytes = 0;

    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 1; //not 2 for csv
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}