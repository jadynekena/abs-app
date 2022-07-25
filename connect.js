const TESTING_MODE_SO_STAY_HERE = false;
const COUNTER_BEGIN = 3

async function signup(e){
	e.preventDefault()
	set_alert('','')

	mymail = document.getElementById('mymail').value.trim()
	mypass = document.getElementById('mypass').value.trim()
	mypass_new = document.getElementById('mypass_new').value.trim()

	const is_in_recovery_mode = recovery_mode()
	//alert(is_in_recovery_mode)

	//recovery mode
	if(is_in_recovery_mode){


		//check if pass is strong enough  (todo)

		//check if pass is same
		if(mypass !== mypass_new) return set_alert('Mots de passe non identiques.','red')

		//check if at least 6 characters
		if(mypass_new.length < 6) return set_alert('Mot de passe trop court.','red')

		const { error, data } = await supabase.auth.api.updateUser(window.sessionStorage.getItem('access_token'), { password : mypass_new })

		if (error){			
			msg = error.message.includes('Password should be at least') ? 'Le mot de passe doit faire 6 caractères minimum.' : error.message
			set_alert(msg,'red')
		}else{
			loading(true)
			var counter = COUNTER_BEGIN
			setInterval(function(a){

				counter = counter-1
				set_alert('Votre mot de passe a bien été changé.<br/><br/>Vous allez être redirigé dans '+(counter)+' secondes...','green')	
				if(counter === 0){
					goto_app()
				}
			}, 1000)
			
		}

	}else if(!mail_ok(mymail)){	
		document.getElementById('mymail').focus()
		set_alert('Merci de saisir une adresse mail valide.','red')

		return false

	}else if(!document.querySelector('#acceptCGU').checked){
		set_alert('Vous devez accepter les conditions d\'utilisation avant de continuer.','red')

		return false

	}else if(mode_connect()) {

		//if no pass : error
		if(mypass.length === 0) return set_alert('Impossible de se connecter avec un mot de passe vide.','red')

		mail_existence = await mail_exists()
		console.log({mail_existence})

		//if mail exists : sigin
		if(mail_existence === "true"){

			let { user, error } = await supabase.auth.signIn({
				email: mymail,
				password: mypass		
			}, {redirectTo: window.location.href })
			
			if (error){
				msg = error.message === 'Invalid login credentials' ? 'Mot de passe incorrect. <a onclick="switch_mode()">Réinitialiser mon mot de passe</a>' : error.message
				set_alert(msg,'red')
			}else{
				goto_app()
			}

		//other wise : sign up mode
		}else{

			let { user, session, error } = await supabase.auth.signUp({
			  email: mymail,
			  password: mypass,
			}, {redirectTo: window.location.href })
			
			if (error){
				msg = error.message === 'Invalid login credentials' ? 'Mot de passe incorrect. <a onclick="switch_mode()">Réinitialiser mon mot de passe</a>'
						: error.message.includes('Password should be at least') ? 'Le mot de passe doit faire 6 caractères minimum.'
						: error.message
				set_alert(msg,'red')
			}else{
				
				Array.from( document.querySelectorAll('button, input, .cgu_container, #reset') ).forEach(e => e.remove())
					
				loading(true)
				var counter = COUNTER_BEGIN
				setInterval(function(a){

					counter = counter-1
					set_alert(`Inscription OK : un mail de confirmation vous a été envoyé.<br/>
								Vous allez être connecté dans ${counter} secondes...`,'green')	
					if(counter === 0){
						goto_app()
					}
				}, 1000)

			}
		}

			
		

	//reset mode
	}else {
		const { data, error } = await supabase.auth.api.resetPasswordForEmail(mymail)

		if(error){
			msg = error.message === 'User not found' ? 'Utilisateur non trouvé. <a onclick="switch_mode()">S\'inscrire</a>' : error.message
			set_alert(msg,'red')

		}else{
			set_alert('Un mail avec un lien de réinitialisation de mot de passe vous a été envoyé à <a href="mailto:'+mymail+'">'+mymail+'</a>. Vérifiez vos spams si besoin.','green')
			document.querySelector('#connect').style.display = 'none'
		}

	}
}

function mode_connect(){
	var reset_node = document.getElementById('reset')
	current_mode = reset_node.innerText

	return current_mode === 'Mot de passe oublié ?' ? true : false

}

function switch_mode(){


	const reset_node = document.getElementById('reset')
	
	//mode normal => mettre le mode reset
	if(mode_connect()){
		reset_node.innerText = '← Revenir en mode connexion'
		document.getElementById('mypass').style.display = 'none'
		document.getElementById('acceptCGU').checked = true
		change_disabled_btn()
		document.querySelector('.cgu_container').style.display = 'none'
		document.querySelector('.showpass_container').style.display = 'none'
		document.getElementById('connect').innerText = 'Envoyer un mail de réinitialisation'

	//mode reset => remettre le mode normal
	}else {
		reset_node.innerText = 'Mot de passe oublié ?'
		document.getElementById('mypass').style.display = ''
		document.getElementById('acceptCGU').checked = false
		document.querySelector('.cgu_container').style.display = ''
		change_disabled_btn()
		document.querySelector('.showpass_container').style.display = ''
		document.getElementById('connect').innerText = 'Se connecter'
		document.querySelector('#connect').style.display = ''
		
		process_if_mail_exists()
	}

	set_alert('','')
}


function set_alert(content,color){
	ab = document.getElementById('alertbox')
	ab.innerHTML = content
	ab.style.color = color
}

function mail_ok(mail){
	return String(mail)
	    .toLowerCase()
	    .match(
	      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	    );
}

async function update_pass(new_password){
	const { error, data } = await supabase.auth.api.updateUser(access_token, { password : new_password })
}

function changing_pass_mode(){
	//console.log('changing pass')


	//UI: hide mail + reset button, display confirm pass, check acceptCGU, hide cgu_container, change button name, change placeholder of mypass
	document.querySelector('#mymail').style.display = 'none'
	document.querySelector('#reset').style.display = 'none'
	document.querySelector('#mypass_new').style.display = 'block'
	document.getElementById('acceptCGU').checked = true
	document.querySelector('.cgu_container').style.display = 'none'
	change_disabled_btn()	
	document.querySelector('#connect').innerText = 'Changer mon mot de passe'
	document.querySelector('#mypass').placeholder = 'Nouveau mot de passe'


	//save access token
	const access_token = current_access_token_exists()
	//console.log({access_token})

	//new tips after 1 second
	setTimeout(function(){
		document.querySelector('#tips').innerText = 'Choisissez votre nouveau mot de passe pour ' + user_mail()	
	}, 100)
	

	window.sessionStorage.setItem('access_token', access_token)
}

function recovery_in_url(){
	const curr_URL = window.location.href
	if(curr_URL.includes('type=recovery')){
		window.sessionStorage.setItem('recovery',true)	
		return true
	}else{
		return window.sessionStorage.getItem('recovery') || false
	}
}

function recovery_mode(){
	const curr_URL = window.location.href
	const there_is_a_session = supabase.auth.session() !== null
	//console.log('there_is_a_session: ' + there_is_a_session)

	//there is a current session AND (we are in FIRST STATE of recovery mode)
	const recov = recovery_in_url()
	const with_access_token = current_access_token_exists().length > 0
	//console.log('(recov: ' + recov,',','with_access_token: ' + with_access_token,')')

	//there IS a session
	const res = there_is_a_session === true && (recov || with_access_token)
	//console.log({res})

	return res
}

function goto_app(){
	setTimeout(function(){
		if(TESTING_MODE_SO_STAY_HERE === false){
			window.sessionStorage.clear()
			document.querySelector('body').style.display = 'none'
			loading(false)
			replace_outer_html()
		}
	}, 1000)
}

async function handle_access_token(){
	const curr_URL = window.location.href

	//recovery mode
	if(recovery_mode()){
		changing_pass_mode()

	}else {
	
		//right tip if NOT recovery
		document.querySelector('#tips').innerHTML = 'Remplissez ce formulaire pour vous <strong>inscrire</strong> ou vous <strong>connecter</strong>.'

		//sign in mode
		if(curr_URL.includes('#access_token=') || current_access_token_exists()){	
			goto_app()			

		//wrong URL
		}else if(curr_URL.includes('unauthorized_client')) {
			window.localStorage.clear()

			set_alert('Le lien que vous avez utilisé a expiré.','red')
		
		//keep night mode if it's the case
		}else {
			var mode = localStorage.getItem('mode');
			window.localStorage.clear()
			if(mode) window.localStorage.setItem('mode',mode);
		}
	}
	

}


async function replace_outer_html(){
	final_word = await who_is_connected() === await getDemoID() ? 'demo' : 'discover'
	window.location.assign('/' + final_word)
}

function change_disabled_btn(){
	
	if(!document.querySelector('#acceptCGU').checked){
		document.getElementById('connect').setAttribute('disabled',true)	
	}else{
		document.getElementById('connect').removeAttribute('disabled')
	}
	
}

async function mail_exists(){

	const id_mail_exists = 'mail_exists_' + document.querySelector('#mymail').value.trim()

	already_exists = false
	if(!window.sessionStorage.getItem(id_mail_exists)){			
		try{
			const { data, error } = await supabase.rpc('mail_exists', { mail: document.getElementById('mymail').value })
			already_exists = data
			window.sessionStorage.setItem(id_mail_exists,already_exists)
		}catch(err){
			already_exists = false
		}
	}else{
		already_exists = window.sessionStorage.getItem(id_mail_exists)
	}

	return already_exists

}

async function process_if_mail_exists(force_not_exist){
	//console.log({force_not_exist})

	if(force_not_exist){

		already_exists = false
		next_steps_after_mail_exist(already_exists)
		return already_exists

	}else{
		//wait until user is done typing (0.5sec)
		return setTimeout(async function(){

			already_exists = await mail_exists()
			next_steps_after_mail_exist(already_exists)
			return already_exists

		}, 100);
	}
	
}

function next_steps_after_mail_exist(already_exists){
	already_exists = eval(already_exists)

	//checked already
	document.querySelector('#acceptCGU').checked = already_exists
	document.querySelector('.cgu_container').style.display= already_exists ? "none" : ""
	change_disabled_btn()


}

function on_mail_change(event){
	set_alert('','')

	if(event.target.id === 'mymail'){

		if(mail_ok(document.getElementById('mymail').value)) {
			process_if_mail_exists(false)
		}else{
			process_if_mail_exists(true)
		}
	}


}

function switch_show_pass(){
	const final_type = document.getElementById("mypass").type === "password" ? "text" : "password"
	document.getElementById("mypass").type = final_type
	document.getElementById("mypass_new").type = final_type

	document.querySelector('#action').innerText = final_type === 'password' ? 'Afficher' : 'Masquer'
}

function delete_all_mail_exists(){
	Object.keys(window.sessionStorage).map((e) => e.includes('mail_exists_') ? window.sessionStorage.removeItem(e) : false )
}

function main(){


		//no mail_exist session storage
		delete_all_mail_exists()

		//events handler : on_event(eventtype,selector, callback)
		on_event('change','#showpass','switch_show_pass()')
		on_event('click','#acceptCGU','change_disabled_btn()')
		on_event('click','#connect','signup(event)')
		on_event('keyup','input','handle_enter(event,signup(event))')
		on_event('input','#mymail, #mypass','on_mail_change(event)')
		on_event('click','#reset','switch_mode()')

	//wait 200 ms 
	setTimeout(function(){
		handle_access_token()		
	}, 200)

}


main()