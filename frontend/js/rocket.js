$(function(){
    $('#vl_aposta').maskMoney({
        prefix: '',
        thousands: '',
        decimal: '.',
        allowZero: true,
        allowNegative: false
    });

    $('#vl_deposit').maskMoney({
        prefix: '',
        thousands: '',
        decimal: '.',
        allowZero: true,
        allowNegative: false
    });


    if($("#continue_aposta").val() == 1 ){
        $("#btn-apostar").hide();
        $("#btn-apostar").prop('disabled', true);
        $("#btn-cash-out").show();
        $("#vl_aposta").val($("#vl_apostado").val());
    }



});

document.addEventListener("DOMContentLoaded", function() {

    var numeroElemento = document.getElementById("odd_view");
    socket = io();

    socket.on('atualizarOdd', function(odd) {
        numeroElemento.textContent = odd + 'x';

        if($("#vl_apostado").val() !== 0){
            let vl_apostado = $("#vl_apostado").val();
            let vl_view     = parseFloat(vl_apostado) * parseFloat(odd);
            let vlFormated  = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vl_view);
            $("#vl_at_cash_out").html('R$ '+formatReal(vlFormated));
        }

    });

    socket.on('atualizaBalance', function(balance) {
        $(".balance_user").html(balance);
     });

    socket.on('loadApostasOn', function(html) {
         let htmlViewApostas = decodeHtml(html);
         $(".results").html(htmlViewApostas);
    });

    socket.on('loadOldOdds', function(html) {
        let htmlOldsOdds = decodeHtml(html);
        $(".olds_odds").html(htmlOldsOdds);
   });

    socket.on('reloadIframe', () => {
        // Recarrega o iframe
        let iframe = document.getElementById("iframe_game");
        iframe.src = iframe.src;
        $("#btn-await-aposta").hide();
        if($("#vl_apostado").val() == 0){
            $("#btn-cash-out").hide();
        }else{
            $("#btn-cash-out").show();
        }
    });

    socket.on('initByApostOn', function(vlAt){
        $("#vl_apostado").val(vlAt);
    });

    socket.on('crashView', function(type) {

        if($("#continue_aposta").val() == 0 ){
            if(type == "show"){
                // encerrou a rodada
                $(".crash").show();
    
                $("#btn-apostar").show();
                $("#btn-apostar").prop('disabled', false);
                $("#btn-cash-out").hide();
                $("#vl_aposta").val('');
                $("#vl_apostado").val(0);
    
            }else{
                $(".crash").hide();
            }
        }

    });

    socket.on('cont_init', function(init) {
        $("#countNewR").html(init); 
    });

    socket.on('aposta_computada', function(vl) {
        
        $("#btn-apostar").hide();
        $("#btn-await-aposta").show();
        $("#vl_apostado").val(vl);

    });

    socket.on('error_apostar', function(msg) {
        $("#btn-apostar").prop('disabled', false);
        showNotification('Ocorreu um erro!', msg, 'error');
    });

    socket.on('error_apostar', function(msg) {
        $("#btn-apostar").prop('disabled', false);
        showNotification('Ocorreu um erro!', msg, 'error');
    });
    
    socket.on('cashout_success', function(odd, vl) {

        let valorCash = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vl);
        let oddCash   = odd;

        showNotification('Você encerrou aposta em '+oddCash+'x', 'Você ganhou '+valorCash);
       
        $("#btn-apostar").show();
        $("#btn-apostar").prop('disabled', true);
        $("#btn-cash-out").hide();
        $("#vl_aposta").val('');
        $("#vl_apostado").val(0);

    });

    socket.on('success_deposit', function(msg) {
        $('.modal_deposit').hide(100);
        $('#vl_deposit').val('');
        showNotification('Você adicionou saldo', msg);
    });

    socket.on('error_deposit', function(msg) {
        $('.modal_deposit').hide(100);
        $('#vl_deposit').val('');
        showNotification('Desculpe', msg, 'error');
    });

    socket.on('logout_success', () => {
         location.href="login";
    });

});


function encodeHtml(string) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
  }

function decodeHtml(str) {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}


function formatReal(valor) {  
    valor = valor + '';
    valor = parseInt(valor.replace(/[\D]+/g,''));
    valor = valor + '';
    valor = valor.replace(/([0-9]{2})$/g, ",$1");
  
    if (valor.length > 6) {
      valor = valor.replace(/([0-9]{3}),([0-9]{2}$)/g, ".$1,$2");
    }
   return valor;
}

$("#btn-apostar").on('click', function(){
    $("#btn-apostar").prop('disabled', true);
    let vl = $("#vl_aposta").val();
    setAposta(vl);
});

function logout(){
    let token  = $("#tagi").val(); 
    const mensagem = 'logout//'+token;
    socket.send(mensagem);
}

function setAposta(vl) {
    let token  = $("#tagi").val(); 
    let vlS    = parseFloat(vl);
    const mensagem = 'setAposta//'+token+'//'+vlS;
    socket.send(mensagem);
}

function depositInit() {
    let token  = $("#tagi").val(); 
    let vlS    = parseFloat($("#vl_deposit").val());
    const mensagem = 'deposit//'+token+'//'+vlS;
    socket.send(mensagem);
}

$("#btn-cash-out").on('click', function(e){
    let token      = $("#tagi").val(); 
    const mensagem = 'cashOut//'+token;
    socket.send(mensagem);
});

$(".vls_fast ul li").on('click', function(e){

    if($("#btn-apostar").is(':visible')){
        let vl = $(this).attr('data-v');
        $("#vl_aposta").val(vl);
    }

});

function showNotification(title, message, color='success'){

      let icons = {error: "fa-circle-xmark", success: "fa-circle-check"};

      $(".notification_message i").removeClass(icons.error);
      $(".notification_message i").removeClass(icons.success);
      if(color == "success"){$(".notification_message i").addClass(icons.success);}else{$(".notification_message i").addClass(icons.error);}
      
      $(".notification_title").html(title);
      $(".notification_message_content").html(message);

      $(".notification").removeClass('success');
      $(".notification").removeClass('error');

      $(".notification").addClass(color);

      if($(".notification ").animate({'margin-right' : "101%",'opacity' : '1',},500)){
           progressNotification = setInterval(() => {
            let w = parseInt($(".notification_progressbar").width());
            if (w > 0) {
                let nW = (w - 40);
                $(".notification_progressbar").width(nW);
            } else {
                clearInterval(progressNotification);
                $(".notification_progressbar").width("100%");
                $(".notification ").animate({'margin-right' : "-100%",'c' : '0',},500);
            }
        }, 1000);
      }
}

