require('dotenv').config();

const express = require('express');
const http = require('http');
const axios = require('axios');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const port     = process.env.PORT || 3000;
const backend  = process.env.URL_BACKEND || 'http://localhost/backend';
const frontend = process.env.URL_FRONTEND || 'http://localhost/frontend';

debug_app = process.env.DEBUG || true;

const hostname = process.env.DB_HOST || 'http://localhost';
const username = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || '';
const database = process.env.DB_NAME || 'rocket';
const port_db  = process.env.DB_PORT || '3306';

value_max = process.env.VALUE_MAX || 10000;
value_min = process.env.VALUE_MIN || 1;

const connection = mysql.createConnection({
    host: hostname,
    user: username,
    password: password,
    database: database,
    port: port_db
});

connection.connect((err) => {
    if (err) {
        if(debug_app){ console.error('Erro de conexão:', err); }
        return;
    }
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

odd             = 1.00;
oddEscohlida    = 0;
secInit         = 10;
atualSec        = 0;
atualToken      = "";
rodadaIdAt      = 0;
secDec          = secInit+1;
tokenUser       = "";
rodadaIniciada  = 0;
rodadaAnterior  = 0;
apostadores     = {};
clientConnected = {};
connectionsOn   = {};

app.set('views', __dirname + '/frontend');
app.set('view engine', 'ejs');


app.get('/login', (req, res) => {
    res.render("login",  {frontend: frontend});
});

app.get('/create', (req, res) => {
    res.render("create",  {frontend: frontend});
});

app.get('/auth/login', (req, res) => {
    getUserName(req.query.username)
    .then(user => {
        if (user) {

            const senhaDigitada = req.query.password;
            const hashArmazenado = user.password; 

            verificarSenha(senhaDigitada, hashArmazenado)
            .then((vSenha) => {
                if (vSenha) {
                    
                    // new token login
                    const tokenAleatorio     = gerarToken();
                    const timestampExpiracao = gerarTimestampExpiracao();

                    connection.query('UPDATE user SET token = ?, expire_token = ? WHERE id = ? ', [tokenAleatorio, timestampExpiracao, user.id], (err, results) => {
                        if (err) {
                            res.json({ erro:  true, message: err });
                        } else {
                            res.json({ erro:  false, token: tokenAleatorio });
                        }
                    });

                } else {
                    res.json({ erro:  true, message: 'Senha inválida' });
                }
            })
            .catch((error) => {
                res.json({ erro:  true, message: 'Senha inválida' });
            });

        }else{
            res.json({ erro:  true, message: 'Username não encontrado.' });
        }
    })
    .catch(err => {
        res.json({ erro:  true, message: err });
    });
});

app.get('/auth/create', (req, res) => {
    getUserName(req.query.username)
    .then(user => {
        if (user) {
            res.json({ erro:  true, message: 'Escolha outro username' });
        }else{
           
            criptografarSenha(req.query.password)
            .then((hash) => {

                const tokenAleatorio     = gerarToken();
                const timestampExpiracao = gerarTimestampExpiracao();
              
               // create account
               const dadosUser = {
                    username: req.query.username,
                    password: hash,
                    token: tokenAleatorio,
                    expire_token: timestampExpiracao,
                    balance: 0.00
                };

                connection.query('INSERT INTO user SET ?', dadosUser, (err, results) => {
                    if (err) {
                        res.json({ erro:  true, message: err });
                    } else {
                        res.json({ erro:  false, token: tokenAleatorio });
                    }
                });

            })
            .catch((error) => {
                res.json({ erro:  true, message: error });
            });

        }
    })
    .catch(err => {
        res.json({ erro:  true, message: err });
    });
});

app.get('/', (req, res) => {

     account = req.query.tagi;

     const url = backend+'/auth?token='+account;
     const dadosParaEnviar = {
         token: account
     };
     
     axios.post(url, dadosParaEnviar)
     .then(response => {
        try {
            let obj = response.data;
            if(obj.erro){
                if(debug_app){ console.log(obj.message); }
                res.render("login",  {frontend: frontend});
            }else{
                
                tokenUser = account;

                getUserByToken(tokenUser)
                .then(user => {
                    if (user) {
                        
                        var params = {
                            frontend: frontend, 
                            sec_init: secInit, 
                            tokenUser: tokenUser,
                            value_init: 0,
                            continue_aposta: 0,
                            userBalance: formatReal(user.balance),
                            userName: user.username
                        };

                        getApostaByUserOn(user.id)
                        .then(apt => {
                            if (apt) {
                                params.value_init = apt.value;
                                params.continue_aposta = 1;
                                getAllsOldsOdds();
                                res.render("dashboard", params);
                            }else{
                                getAllsOldsOdds();
                                res.render("dashboard", params);
                            }
                        })
                        .catch(err => {
                            getAllsOldsOdds();
                            res.render("dashboard", params);
                        });

                        setInterval(() => {
                            loadBalance(tokenUser);
                        }, 1000);

                    } else {
                        // render page create account or game demo
                        res.render("login",  {frontend: frontend});
                    }
                })
                .catch(err => {
                    if(debug_app){ console.error('Erro:', err); }
                });
            }
        } catch (error) {
            res.render("login",  {frontend: frontend});
            if(debug_app){  console.error('Erro na autenticação 2', error); }
        }
     })
     .catch(error => {
        if(debug_app){ console.error('Erro na requisição:', error); }
     });

});

function gerarToken() {
    const caracteres = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const comprimentoToken = 60;
    let token = '';
  
    for (let i = 0; i < comprimentoToken; i++) {
      const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
      token += caracteres.charAt(indiceAleatorio);
    }
  
    return token;
  }

  function gerarTimestampExpiracao() {
    const agora = new Date();
    const umHoraDepois = new Date(agora.getTime() + 60 * 60 * 1000);
    const timestampExpiracao = umHoraDepois.getTime();
    return timestampExpiracao;
  }
const verificarSenha = async (senha, hash) => {
    try {
      const resultado = await bcrypt.compare(senha, hash);
      return resultado;
    } catch (error) {
      throw error;
    }
  };

const criptografarSenha = async (senha) => {
    try {
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(senha, salt);
      return hash;
    } catch (error) {
      throw error;
    }
  };

function loadBalance(tk){
    getUserByToken(tk)
    .then(user => {
        if (user) {
            if(typeof connectionsOn[tk] !== "undefined"){
                connectionsOn[tk].cli.emit('atualizaBalance', formatReal(user.balance));
            }
        }
    })
    .catch(err => {
        if(debug_app){ console.log(err); }
    });
}


function addBalanceUser(vl, tk){
    getUserByToken(tk)
    .then(user => {
        if (user) {
            let balanceAt = user.balance;
            let newBalanceUser = parseFloat((parseFloat(balanceAt) + parseFloat(vl))).toFixed(2);

            connection.query('UPDATE user SET balance = ? WHERE id = ? ', [newBalanceUser, user.id], (err, results) => {
                if (err) {
                    if(debug_app){ console.log(err); }
                } else {
                    // cash out realizado
                    if(debug_app){ console.log('add balance user'); }
                }
            });

        }
    })
    .catch(err => {
        if(debug_app){ console.log(err); }
    });
}


function getApostaByUserOn(user_id){
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM apostas WHERE user_id = ? AND status = ? AND rodada_id = ? LIMIT 1', [user_id, 1, rodadaIdAt], (err, results, fields) => {
            if (err) {
                if(debug_app){ console.error('Erro na consulta:', err); }
                reject(err);
            } else {
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function getUserName(username){
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user WHERE username = ? LIMIT 1', [username], (err, results, fields) => {
            if (err) {
                if(debug_app){ console.error('Erro na consulta:', err); }
                reject(err);
            } else {
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function getOdd(){
    const url = backend+'/getOdd';
    axios.post(url)
    .then(response => {
        let obj = response.data;
        if(obj.erro){
            if(debug_app){ console.log(obj.message); }
        }else{

            oddEscohlida = obj.odd;
            loadOdds      = setInterval(atualizarOdd, 100);
        }
    })
    .catch(error => {
        if(debug_app){ console.error('Erro na requisição:', error); }
    });
}

function setPerdidaRodadaUsers(rodada_id){
    connection.query('UPDATE apostas SET status = ? WHERE rodada_id = ? AND status = ? ', [3, rodada_id, 1], (err, results) => {
        if (err) {
            if(debug_app){ console.log(err); }
        }
    });
}

function setOddRodada(rodada_id, oddCrash){
    oddCrash = oddCrash.toFixed(2);
    connection.query('UPDATE rodada SET odd_crash = ? WHERE id = ?', [oddCrash, rodada_id], (err, results) => {
        if (err) {
            if(debug_app){ console.log(err); }
        }
    });
}


function setEncerradaRodada(rodada_id){
    connection.query('UPDATE rodada SET status = ? WHERE id = ?', [2, rodada_id], (err, results) => {
        if (err) {
            if(debug_app){ console.error('Erro ao encerrar rodada:', err); }
        }
    });
}

function atualizarOdd() {
    odd = odd+0.01;
    if (odd <= oddEscohlida) {
        io.emit('atualizarOdd', odd.toFixed(2));
    }else{
        // encerrar rodada
        setOddRodada(rodadaIdAt, oddEscohlida);

        clearInterval(loadOdds);

        apostadores    = {};
        
        rodadaIniciada = 0;
        const rodadaId = rodadaIdAt;

        setPerdidaRodadaUsers(rodadaId);
        setEncerradaRodada(rodadaId);

        io.emit('crashView', 'show');
        
        if(oddEscohlida == 1){
            io.emit('atualizarOdd', '1.00');
        }else{
            io.emit('atualizarOdd', oddEscohlida);
        }

        oddEscohlida = 0;
        odd = 1.00;
    }
    
}

function newRodada(){

    getAllsOldsOdds();

    const url = backend+'/newRodada';
    axios.post(url)
    .then(response => {
        rodadaAnterior = response.id;
    })
    .catch(error => {
        if(debug_app){ console.error('Erro ao criar rodada:', error); }
    });
}

function setAllRodadasEnd(){
    connection.query('UPDATE rodada SET status = ? WHERE status = ?', [2, 1], (err, results) => {
        if (err) {
            if(debug_app){ console.error('Erro ao encerrar rodada:', err); }
        } 
    });
}

function initApplication(){

    setAllRodadasEnd();

    setInterval(() => {
        // verificar rodada a cada segundo
        connection.query('SELECT * FROM rodada WHERE status != 2 LIMIT 1', (err, results, fields) => {

            if (err) {
                if(debug_app){ console.error('Erro na consulta:', err); }
                return;
            }
            if (results.length > 0) {

                atualToken = results[0].token;
                rodadaIdAt = results[0].id;

                getAllsApostasOnView(rodadaIdAt);

                if(results[0].status == 0){

                    // verifica o time para entrar na rodada
                    
                    if(atualSec >= secInit){

                        io.emit('reloadIframe');

                        secDec = secInit + 1;

                        io.emit('crashView', 'hide');

                        // get new odd
                        // init rodada
                        getOdd();

                        getAllsOldsOdds();

                        // fazendo updade para dar start na rodada
                        const rodadaId = results[0].id;
                        const statusR = '1';

                        connection.query('UPDATE rodada SET status = ? WHERE id = ?', [statusR, rodadaId], (err, results) => {
                            if (err) {
                                if(debug_app){  console.error('erro ao iniciar rodada ('+rodadaId+') :', err); }
                            } else {
                                rodadaIniciada = 1;
                            }
                        });
                        
                        atualSec = 0;
                    }

                    secDec = (secDec - 1)

                    io.emit('cont_init', secDec);
                    atualSec++;
                    
                }

            }else{
                newRodada();
            }
            
        });
        
    }, 1000);
}

function encodeHtml(str) {
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

function setCorOdd(oddView, bar=false){
    oddView = parseFloat(oddView);
    if(bar){
        if(oddView < 1.10){
            return "odd_red"; 
        }else{
            if(oddView > 1.01 && oddView < 1.99){
                return "odd_min";
            }else if(oddView > 2 && oddView < 6.99){
                return "odd_purple";
            }else if(oddView > 7 && oddView < 19.99){
                return "odd_blue";
            }else if(oddView > 20){
                return "odd_black";
            }
        }

    }else{
        if(oddView > 1 && oddView < 1.99){
            return "odd_red";
        }else if(oddView > 2 && oddView < 6.99){
            return "odd_purple";
        }else if(oddView > 7 && oddView < 19.99){
            return "odd_blue";
        }else if(oddView > 20){
            return "odd_black";
        }
    }

}

function getAllsOldsOdds(){
    connection.query('SELECT * FROM rodada WHERE status = ? ORDER BY id DESC LIMIT 20', [2], (err, results, fields) => {
        if (err) {
            if(debug_app){ console.error('Erro na consulta:', err); }
        } else {
            if (results.length > 0) {

                var html = '<ul>';
                 
                results.forEach(result => {

                    let colorOdd = '';
                    let oddViewBar = result.odd_crash;
                    if(result.odd_crash !== null){
                       
                         if(result.odd_crash == 1){
                            oddViewBar = '1.00';
                         }
                        
                        colorOdd = setCorOdd(result.odd_crash, true);
                        html += '<li class="'+colorOdd+'" >'+oddViewBar+'x</li>';
                    }

                
                });

                html += '</ul>';

                let base64Html = encodeHtml(html);
                io.emit('loadOldOdds', base64Html);

            } 
        }
    });
}

function getAllsApostasOnView(rodada_id){
    connection.query('SELECT a.value, a.status, a.odd, a.ganho, u.username FROM apostas a LEFT JOIN user u ON a.user_id = u.id WHERE a.rodada_id = ?', [rodada_id], (err, results, fields) => {
        if (err) {
            if(debug_app){ console.error('Erro na consulta:', err); }
        } else {
            if (results.length > 0) {

                var vlTotal = 0;
                results.forEach(ap => {
                    vlTotal = (vlTotal + parseFloat(ap.value));
                });
                vlTotal = formatReal(parseFloat(vlTotal));

                var html = '<div class="mt-3 info-apostas"><span>Apostas: '+results.length+'</span><span>Total: '+vlTotal+'</span></div> <ul>';
                html += '<li class="headApostasOn" > <span></span> <span>Username</span> <span>Aposta</span> <span>x</span> <span>Sacar</span> </li>';

                results.forEach(result => {
                    
                    let classActive = "";
                    if(result.status == 2){
                        classActive = "active";
                    }
                    
                    let oddViewLi = '';
                    if(result.odd !== null){
                        let colorOdd = setCorOdd(result.odd);
                        oddViewLi = '<span class="'+colorOdd+'">'+result.odd+'x</span>';
                    }

                    let ganhoViewLi = '';
                    if(result.ganho !== null){
                        ganhoViewLi = formatReal(parseFloat(result.ganho));
                    }

                    let vlApostado = formatReal(parseFloat(result.value));
   
                    
                    html += '<li class="'+classActive+'" > <span><img src="'+frontend+'/images/profile.png" /> </span>';
                    html += '<span class="name">'+result.username+'</span>';
                    html += '<span class="aspota">'+vlApostado+'</span>';
                    html += '<span class="odd"> '+oddViewLi+' </span>';
                    html += '<span class="ganho">'+ganhoViewLi+'</span></li>';

                });

                html += '</ul>';

                let base64Html = encodeHtml(html);
                io.emit('loadApostasOn', base64Html);

            } else {
                var html = '<div class="mt-3 info-apostas"><span>Apostas: 0</span><span>Total: R$ 0,00</span></div>';
                html += '<p class="text-center" >Nenhuma aposta</p>';

                let base64Html = encodeHtml(html);
                io.emit('loadApostasOn', base64Html);

            }
        }
    });
}

function getUserByToken(tk) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user WHERE token = ? LIMIT 1', [tk], (err, results, fields) => {
            if (err) {
                if(debug_app){ console.error('Erro na consulta:', err); }
                reject(err);
            } else {
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function getApostaByid(aposta_id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM apostas WHERE id = ? LIMIT 1', [aposta_id], (err, results, fields) => {
            if (err) {
                if(debug_app){ console.error('Erro na consulta:', err); }
                reject(err);
            } else {
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function getRodadaById(rodada_id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM rodada WHERE id = ? LIMIT 1', [rodada_id], (err, results, fields) => {
            if (err) {
                if(debug_app){ console.error('Erro na consulta:', err); }
                reject(err);
            } else {
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function reverseReal(valor) {
    valor = valor.replace(/\./g, '');
    valor = valor.replace(',', '.');
    return parseFloat(valor);
}

function formatReal(valor) {  
    valor = parseFloat(valor);
    valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
   return valor;
}


io.on('connection', (socket) => {

    if(tokenUser !== ""){
        
        connectionsOn[tokenUser] = {cli: socket};

    }else{
        socket.emit('directLogin');
    }

    if(atualSec < secInit){
        if(oddEscohlida == 0){
            socket.emit('crashView', 'show');
        }
        getAllsOldsOdds();
    }

    
    socket.on('message', (message) => {

        let arrayParams = message.split('//');

        if(arrayParams[0] == "setAposta"){
             // init rodade
             // verificar user
             getUserByToken(arrayParams[1])
             .then(user => {
                 if (user) {
                    
                        // verificar se rodada está na contagem
                        if(rodadaIniciada < 1 ){

                            // verifica se já n fez aposta
                            if (apostadores[user.id] === undefined) {

                                // formatar valores
                                let vl_max_formatado = formatReal(value_max);
                                let vl_min_formatado = formatReal(value_min);

                                // verificar valor da aposta
                                if(arrayParams[2] != ""){
                                    let vl = reverseReal(arrayParams[2]);
                                    if(vl >= value_min && vl <= value_max){

                                        let balanceAt = user.balance;

                                        if(parseFloat(balanceAt) >= parseFloat(vl)){

                                            let newBalanceUser = parseFloat( (parseFloat(balanceAt) - parseFloat(vl)) ).toFixed(2);
                                            
                                            connection.query('UPDATE user SET balance = ? WHERE id = ?', [newBalanceUser, user.id], (err, results) => {
                                                if (err) {
                                                    if(debug_app){ console.log(err); }
                                                } 
                                            });

                                            
                                          // inserir aposta
                                           const novaAposta = {
                                                user_id: user.id,
                                                rodada_id: rodadaIdAt,
                                                value: arrayParams[2],
                                                status: 1
                                            };
                        
                                            connection.query('INSERT INTO apostas SET ?', novaAposta, (err, results) => {
                                                if (err) {
                                                    let msg_error = 'Desculpe, não conseguimos computar sua aposta';
                                                    socket.emit('error_apostar', msg_error);
                                                    if(debug_app){ console.log('Erro criar aposta:', err); }
                                                } else {

                                                    apostadores[user.id] = {vl: vl, rodada: rodadaIdAt, aposta: results.insertId };
                                                    socket.emit('aposta_computada', vl);

                                                }
                                            });


                                        }else{
                                            let msg_error = 'Você não tem saldo suficiente.';
                                            socket.emit('error_apostar', msg_error);
                                            if(debug_app){ console.log(msg_error); }
                                        }
    

                                    }else{
                                        let msg_error = 'Sua aposta deve ser entre '+vl_min_formatado+' e '+vl_max_formatado;
                                        socket.emit('error_apostar', msg_error);
                                        if(debug_app){ console.log(msg_error); }
                                    }
                                }else{
                                    let msg_error = 'Sua aposta deve ser entre '+vl_min_formatado+' e '+vl_max_formatado;
                                    socket.emit('error_apostar', msg_error);
                                    if(debug_app){ console.log(msg_error); }
                                }

                            }else{
                                let msg_error = 'Sua aposta ja foi computada';
                                socket.emit('error_apostar', msg_error);
                                if(debug_app){ console.log(msg_error); }
                            }

                        }else{
                            let msg_error = 'Aguarde nova rodadada';
                            socket.emit('error_apostar', msg_error);
                            if(debug_app){ console.log(msg_error); }
                        }

                 } else {
                    let msg_error = 'Nenhum usuário encontrado.';
                    socket.emit('error_apostar', msg_error);
                    if(debug_app){ console.log(msg_error); }
                 }
             })
             .catch(err => {
                if(debug_app){ console.error('Erro:', err); }
             });

        }else if(arrayParams[0] == "cashOut"){
            // cash out

            // salvar odd escolhida no cashout
            let oddSave = odd;

            // verify user
            getUserByToken(arrayParams[1])
            .then(user => {
                if (user) {

                    if ( apostadores[user.id] ) {

                        let rodada_id = apostadores[user.id].rodada;
                        let aposta_id = apostadores[user.id].aposta;
                        let vl_aposta = apostadores[user.id].vl;

                        // verificar rodada
                        getRodadaById(rodada_id)
                        .then(rodada => {
                            if (rodada) {

                                // verificar se rodada já foi finalizada
                                if(rodada.status == 1){

                                    // verificar aposta
                                    getApostaByid(aposta_id)
                                    .then(aposta => {
                                        if (aposta) {
                                            // aposta localizada

                                            // verificar se aposta ja foi finalizada
                                            if(aposta.status == 1){

                                                // calcular valor ganho baseado na odd
                                                let vl_ganho = (parseFloat(vl_aposta) * parseFloat(oddSave)).toFixed(2);

                                                // salvar valor ganho na aposta
                                                connection.query('UPDATE apostas SET status = ?, odd = ?, ganho = ? WHERE id = ?', [2, oddSave.toFixed(2), vl_ganho, aposta_id], (err, results) => {
                                                    if (err) {
                                                        let msg_error = 'Desculpe, erro ao sair da rodada';
                                                        socket.emit('error_apostar', msg_error);
                                                        if(debug_app){ console.log(err); }
                                                    } else {
                                                        // cash out realizado
                                                        let neCalc = (parseFloat(vl_aposta) * parseFloat(oddSave)).toFixed(2);
                                                        let ntOdd = parseFloat(oddSave).toFixed(2);

                                                        addBalanceUser(vl_ganho, user.token);
                                                        
                                                        socket.emit('cashout_success', ntOdd, neCalc);

                                                    }
                                                });

                                            }else {
                                                let msg_error = 'Sua aposta já foi encerrada!';
                                                socket.emit('error_apostar', msg_error);
                                                if(debug_app){ console.log(msg_error); }
                                            }
                                        } else {
                                            let msg_error = 'Aposta não localizada';
                                            socket.emit('error_apostar', msg_error);
                                            if(debug_app){ console.log(msg_error); }
                                        }
                                    })
                                    .catch(err => {
                                        let msg_error = 'Aposta não localizada';
                                        socket.emit('error_apostar', msg_error);
                                        if(debug_app){ console.log(err); }
                                    });

                                }else{
                                    let msg_error = 'A rodada já foi encerrada ou ainda não começou';
                                    socket.emit('error_apostar', msg_error);
                                    if(debug_app){ console.log(msg_error); }
                                }

                            } else {
                                let msg_error = 'Rodada não encontrada';
                                socket.emit('error_apostar', msg_error);
                                if(debug_app){ console.log(msg_error); }
                            }
                        })
                        .catch(err => {
                            let msg_error = 'Rodada não encontrada';
                            socket.emit('error_apostar', msg_error);
                            if(debug_app){ console.log(err); }
                        });

                    
                    }else{
                        let msg_error = 'Você não entrou nesta rodada';
                        socket.emit('error_apostar', msg_error);
                        if(debug_app){ console.log(msg_error); }
                    }

                } else {
                    let msg_error = 'Nenhum usuário encontrado. 2';
                    socket.emit('error_apostar', msg_error);
                    if(debug_app){ console.log(msg_error); }
                }
            })
            .catch(err => {
                let msg_error = 'Nenhum usuário encontrado. 1';
                socket.emit('error_apostar', msg_error);
                if(debug_app){ console.log(err); }
            });

        }else if(arrayParams[0] == "deposit"){
            getUserByToken(arrayParams[1])
            .then(user => {
                if (user) {

                   let vl = (parseFloat(arrayParams[2]) + parseFloat(user.balance)).toFixed(2);

                   // executar aqui gateway de pagamento
                   connection.query('UPDATE user SET balance = ? WHERE id = ?', [vl, user.id], (err, results) => {
                    if (err) {
                        socket.emit('error_deposit', 'Erro ao depositar');
                    } else {
                        let viewAddBalance = formatReal(arrayParams[2]);
                        socket.emit('success_deposit', viewAddBalance+' adicionado em sua carteira');
                    }
                });

                } else {
                    let msg_error = 'Nenhum usuário encontrado;';
                    socket.emit('error_apostar', msg_error);
                    if(debug_app){ console.log(msg_error); }
                }
            })
            .catch(err => {
                let msg_error = 'Nenhum usuário encontrado.';
                socket.emit('error_apostar', msg_error);
                if(debug_app){ console.log(err); }
            });

        }else if(arrayParams[0] == "logout"){
            getUserByToken(arrayParams[1])
            .then(user => {
                if (user) {

                   connection.query('UPDATE user SET token = ?, expire_token = ? WHERE id = ?', ['-', 0, user.id], (err, results) => {
                    if (err) {
                        console.log( 'Erro ao deslogar');
                    } else {
                        console.log( 'logout');
                        tokenUser="";
                        socket.emit('logout_success');
                    }
                });

                } else {
                    let msg_error = 'Nenhum usuário encontrado;';
                    socket.emit('error_apostar', msg_error);
                    if(debug_app){ console.log(msg_error); }
                }
            })
            .catch(err => {
                let msg_error = 'Nenhum usuário encontrado.';
                socket.emit('error_apostar', msg_error);
                if(debug_app){ console.log(err); }
            });
        }

    });

});



server.listen(3000, () => {
    initApplication();
    console.log('Servidor rodando em http://localhost:'+port);
});
