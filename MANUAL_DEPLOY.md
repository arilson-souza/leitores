# Manual de Instalação: Sistema de Escalas (Ubuntu 20.04 - Contabo)

Este guia prático descreve o passo a passo para instalar e colocar em produção o **Sistema de Escalas Paroquial** desenvolvido em banco de dados SQLite e Node.js (Next.js) num VPS recém-adquirido da Contabo rodando **Ubuntu 20.04 LTS**. O servidor usará Nginx como proxy reverso para expor a aplicação na porta 80 e 443 (com Certificado SSL grátis).

---

## 1. Acesso Inicial ao Servidor

Acesse o seu servidor via SSH. Substitua o IP abaixo pelo IP do seu servidor Contabo:
```bash
ssh root@SEU_IP_AQUI
```

Em seguida, atualize todos os pacotes do sistema operacional:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Instalando as Ferramentas Básicas (Node.js e Git)

O Next.js exige o Node.js. Vamos instalar a versão mais recente e estável (v20) através do repositório NodeSource.

```bash
# Baixando e instalando o repositório Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalando NodeJS e Git
sudo apt install -y nodejs git build-essential nginx
```

Verifique se a instalação ocorreu com sucesso:
```bash
node -v
npm -v
git --version
```

---

## 3. Clonando o seu Projeto do GitHub

Vá para a pasta padrão de hospedeiros no Ubuntu (ex: `/var/www`) e baixe os arquivos fonte do sistema.

```bash
cd /var/www

# Clone o seu repositório (substitua a URL pelo seu Github real caso esteja privado ou mude o nome da pasta)
sudo git clone https://github.com/arilson-souza/leitores.git escalas-paroquia

# Dê a você as permissões adequadas:
sudo chown -R $USER:$USER /var/www/escalas-paroquia
```

---

## 4. Instalando Dependências, Variáveis e Gerando o Build

Entre na pasta recém-clonada:
```bash
cd /var/www/escalas-paroquia
```

Agora, instale todas as dependências do projeto (bibliotecas do React, Next.js, better-sqlite3):
```bash
npm install
```

### Configurando o Arquivo .env
O sistema conta com um segredo para proteger o controle de acesso (JWT). Crie um arquivo oculto chamado `.env.local` e defina sua senha mestra lá.
```bash
nano .env.local
```
Cole o seguinte conteúdo dentro dele (substitua a senha por algo próprio):
```env
JWT_SECRET="sua_senha_super_secreta_e_segura_aqui"
```
*(Para salvar e sair do `nano`: `Ctrl+O`, `Enter`, `Ctrl+X`)*

### Compilando o Projeto
Para que o site suba super rápido em produção, deve-se "buildar" o código fonte com o Next.js:
```bash
npm run build
```
*(Observação: esse passo pode levar um minutinho. Ele irá gerar os arquivos otimizados e comprimir tudo).*

## 5. Rodando o Projeto em Background com PM2

Se rodarmos o sistema com `npm start`, quando você fechar a aba preta (SSH) a tela vai cair. Precisamos do PM2 para mantê-lo rodando de pé e reiniciar automaticamente em caso de pane ou erro de luz da Contabo.

Instale o PM2 globalmente:
```bash
sudo npm install -g pm2
```

Inicie o servidor de Escalas Paroquiais por trás do PM2:
```bash
pm2 start npm --name "escalas-paroquia" -- run start -- -p 3000
```

Se tudo deu certo, o PM2 deve listar o sistema como **online**. Salve para que, se o servidor reiniciar sozinho, a aplicação levante na sequência inicial do Ubuntu:
```bash
pm2 save
pm2 startup
```
*(O último comando `pm2 startup` irá imprimir um grande texto. Apenas copie a linha do `sudo env PATH=$PATH...` da tela e cole no terminal para executar e fixar no sistema).*

---

## 6. Configurando o Domínio com Web Server (Nginx)

Neste ponto, o sistema está rodando localmente no servidor na porta `3000`. O Nginx conectará a porta padrão da internet HTTP (80) até o Next.js.

Crie um bloco de configuração do Nginx:
```bash
sudo nano /etc/nginx/sites-available/escalas-paroquia
```

Copie e cole a configuração abaixo (**Atenção**: Troque `seusite.com.br` para o seu próprio domínio. Se não tiver domínio comprado ainda, digite `_` no lugar de `server_name` temporariamente):

```nginx
server {
    listen 80;
    server_name seusite.com.br www.seusite.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative e reinicie o servidor web (Nginx):
```bash
# Ativa o arquivo criando o atalho simbólico:
sudo ln -s /etc/nginx/sites-available/escalas-paroquia /etc/nginx/sites-enabled/

# Testa se não há erro de digitação no nosso arquivo:
sudo nginx -t

# Reinicia o servidor
sudo systemctl restart nginx
```

A partir deste momento, se você digitar o IP do servidor (ou domínio) no seu navegador, a página da paróquia irá aparecer!

---

## 7. Colocando o Cadeado Verde (HTTPS SSL)

*Pré-requisito: Você já precisa ter apontado os DNS do seu domínio comprado (registro.br, godaddy, etc) para o IP do seu servidor da Contabo.*

Se o ponto anterior for verdadeiro, você instalará o Certificado gratuito pelo Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Rode o rastreador de domínio:
```bash
sudo certbot --nginx -d seusite.com.br -d www.seusite.com.br
```

Preencha as perguntas padrão (email de contato, aceitar licença `Y`) e o seu Nginx será automaticamente protegido para acesso HTTPS (cadeadinho verdinho).

## 🎉 Parabéns

A infraestrutura rodando em sua VPS Contabo agora está completa, estável e escalável. Sempre que você fizer uma modificação local, fizer um "commit" no git e enviar, tudo que você precisará fazer via SSH para ver a novidade em produção será:

```bash
cd /var/www/escalas-paroquia
git pull origin main
npm run build
pm2 restart escalas-paroquia
```
