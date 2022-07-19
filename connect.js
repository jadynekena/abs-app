const SUPABASE_URL = "https://ojfpzzbgxyrtwmqolqwa.supabase.co"
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZnB6emJneHlydHdtcW9scXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTc1MTU2OTMsImV4cCI6MTk3MzA5MTY5M30.Cw-t8RhhDHs0vKA6Q-zpQRL5JrX9vMX5g9oThszCEC4'
const { createClient } = supabase
var supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function signup(e){
	e.preventDefault()

	mymail = document.getElementById('mymail').value

	if(mail_ok(mymail)){		
		let { user, error } = await supabase.auth.signIn({
			email: mymail			
		}, {redirectTo: window.location.href })

		
		if (error){
			set_alert('ERREUR : ' + error.message,'red')
		}else{
			set_alert('Un mail avec un lien de connexion vous a été envoyé. Vérifiez vos spams si besoin.','green')
			document.getElementById('connect').disabled = true
		}
		
		return {user,error}
	}else {
		document.getElementById('mymail').focus()
		set_alert('Merci de saisir une adresse mail valide.','red')
		return false
	}
}


function set_alert(content,color){
	ab = document.getElementById('alertbox')
	ab.innerText = content
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

		window.localStorage.setItem('access_token', current_access_token_exists())
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


function replace_outer_html(){
	final_word = current_access_token_exists() === 'demo' ? 'demo' : 'discover'
	window.location.assign('/' + final_word)
}



function current_access_token_exists(){
	return 	window.localStorage.getItem('supabase.auth.token') ? JSON.parse(window.localStorage.getItem('supabase.auth.token'))['currentSession']['access_token'] : false
}

function main(){
	document.getElementById('connect').addEventListener('click', signup)
	document.getElementById('mymail').addEventListener('keydown', function(event){
		if(event.key === "Enter") signup(event)
	})
	handle_access_token()
}


main()