function validate() {
    let username = document.getElementById('username');
    let password = document.getElementById('password');

    if (username.value == "" || username.value.trim() == "") {
        let errorLogin = document.getElementById('errorLogin');
        let errorUsername = document.getElementById('errorUsername');
        let errorPassword = document.getElementById('errorPassword');
        errorUsername.innerHTML = "(*) Please input Username ";
        errorPassword.innerHTML = "";
        errorLogin.innerHTML = "";
        return false;
    }
    else if (password.value == "" || password.value.trim() == "") {
        let errorLogin = document.getElementById('errorLogin');
        let errorPassword = document.getElementById('errorPassword');
        let errorUsername = document.getElementById('errorUsername');
        errorPassword.innerHTML = "(*) Please input Password";
        errorUsername.innerHTML = "";
        errorLogin.innerHTML = "";
        return false;
    }
    else {
        return true;
    }
}