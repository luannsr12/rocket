$("#login-btn").on('click', function(e){
    let username = $("#username").val();
    let password = $("#password").val();

    if(username == "" || password == ""){
        alert('Preencha todos os campos');
        return false;
    }

    $.get('/auth/login', {username, password}, function(res){
        try {
            var obj = res;
            if(obj.erro){
                alert(obj.message);
            }else{
                location.href='/?tagi='+obj.token;
            }
        } catch (error) {
            console.log(error);
        }
    });

});

$("#create-btn").on('click', function(e){
    let username = $("#username").val();
    let password = $("#password").val();

    if(username == "" || password == ""){
        alert('Preencha todos os campos');
        return false;
    }

    $.get('/auth/create', {username, password}, function(res){
        try {
            var obj = res;
            if(obj.erro){
                alert(obj.message);
            }else{
                location.href='/?tagi='+obj.token;
            }
        } catch (error) {
            console.log(error);
        }
    });
});

