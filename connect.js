async function signup(e){
	e.preventDefault()
	set_alert('','')

	mymail = document.getElementById('mymail').value

	if(!mail_ok(mymail)){	
		document.getElementById('mymail').focus()
		set_alert('Merci de saisir une adresse mail valide.','red')

		return false

	}else if(!document.querySelector('#acceptCGU').checked){
		set_alert('Vous devez accepter les conditions d\'utilisation avant de continuer.','red')

		return false

	}else {
			
		let { user, error } = await supabase.auth.signIn({
			email: mymail			
		}, {redirectTo: window.location.href })

		
		if (error){
			set_alert('ERREUR : ' + error.message,'red')
		}else{
			set_alert('Un mail avec un lien de connexion vous a été envoyé à <a href="mailto:'+mymail+'">'+mymail+'</a>. Vérifiez vos spams si besoin.','green')
			Array.from( document.querySelectorAll('button, input, .cgu_container') ).forEach(e => e.remove())
		}
		
		return {user,error}
	}
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



function handle_access_token(){
	const curr_URL = window.location.href
	if(curr_URL.includes('#access_token=') || current_access_token_exists()){		
		document.querySelector('body').style.display = 'none'

		setTimeout(function(){
			replace_outer_html()
		}, 1000)
		

	}else if(curr_URL.includes('unauthorized_client')) {
		window.localStorage.clear()

		set_alert('ERREUR : Le lien que vous avez utilisé a expiré.','red')
	
	}else {
		window.localStorage.clear()
	}
	
}


async function replace_outer_html(){
	final_word = await who_is_connected() === await getDemoID() ? 'demo' : 'discover'
	window.location.assign('/' + final_word)
}

function change_disabled_btn(ceci){
	
	if(!document.querySelector('#acceptCGU').checked){
		document.getElementById('connect').setAttribute('disabled',true)	
	}else{
		document.getElementById('connect').removeAttribute('disabled')
	}
	
}

async function process_if_mail_exists(force_not_exist){
	//console.log({force_not_exist})

	if(force_not_exist){

		already_exists = false

	}else{
		const { data, error } = await supabase.rpc('mail_exists', { mail: document.getElementById('mymail').value })
		already_exists = data

	}


	document.querySelector('#acceptCGU').checked = already_exists
	document.querySelector('.cgu_container').style.display= already_exists ? "none" : ""
	set_alert((already_exists ? 'Un plaisir de vous revoir 🤗' : ''),'green')
	change_disabled_btn()

}

function on_mail_change(event){
	//

	if(event.key === "Enter") signup(event)
	if(mail_ok(document.getElementById('mymail').value)) {
		process_if_mail_exists(false)
	}else{
		process_if_mail_exists(true)
	}


}

function main(){
	document.getElementById('acceptCGU').addEventListener('click', change_disabled_btn)
	document.getElementById('connect').addEventListener('click', signup)
	document.getElementById('mymail').addEventListener('keyup', function(event){ on_mail_change(event)})
	document.getElementById('mymail').addEventListener('input', function(event){ on_mail_change(event)})
	handle_access_token()
}


main()