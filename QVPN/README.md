# Quantum-Safe VPN (QVPN) Deployment Guide

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This guide walks you through deploying a **Quantum‑Safe VPN (QVPN)** – a custom OpenVPN setup that integrates post‑quantum cryptographic (PQC) key exchange. By using the hybrid `X25519MLKEM768` TLS group, your VPN tunnels are protected against future quantum‑computer attacks.

**Key features:**

- Post‑quantum ready – uses `X25519MLKEM768` for key exchange.
- Built from source – ensures latest OpenSSL 3.x support.
- Full PKI management with Easy‑RSA.
- Routes VPN clients to internal subnets with IP forwarding and NAT.

---

## Prerequisites

- **Server OS:** Ubuntu 26.04 LTS (or any Debian‑based distribution).
- **Network:** Static public IP and outbound internet access on the server.
- **Client:** Any device that runs OpenVPN (Windows, macOS, Linux, Android, iOS).

---

## Table of Contents

1. [Building OpenVPN from Source](#building-openvpn-from-source)
2. [Server Configuration](#server-configuration)
3. [Public Key Infrastructure (PKI) Setup](#public-key-infrastructure-pki-setup)
4. [Deploy Certificates](#deploy-certificates)
5. [Enable IP Forwarding and Firewall Rules](#enable-ip-forwarding-and-firewall-rules)
6. [Creating Client Configurations](#creating-client-configurations)
7. [Verification](#verification)

---

## Building OpenVPN from Source

The distribution‑packaged OpenVPN often lacks support for OpenSSL 3.x TLS 1.3 groups. Compiling from source guarantees you get the latest features, including `X25519MLKEM768`.

1. **Install Git and clone the repository:**

   ```bash
   sudo apt update
   sudo apt install git -y
   git clone https://github.com/OpenVPN/openvpn.git
   cd openvpn
### 2. Install Build Dependencies:

   ```bash
sudo apt update
sudo apt install -y autoconf automake libtool libtool-bin pkg-config \
    libnl-3-dev libnl-genl-3-dev libssl-dev liblzo2-dev libpam0g-dev \
    libcap-ng-dev make gcc liblz4-dev g++ build-essential
```
### 3. Compile and Install:

   ```bash
autoreconf -i
./configure --disable-dco
sudo make
sudo make install
```
### 4. Verify Installation:

   ```bash
/usr/local/sbin/openvpn --version
```
Ensure the output shows OpenSSL 3.x support and the ```X25519MLKEM768``` group.

## Server Configuration
Create the server configuration file to define the VPN parameters.

### 1. Create the Server Directory:

```bash
sudo mkdir -p /etc/openvpn/server
```
### 2. Create and Edit the Configuration File:

```bash
sudo nano /etc/openvpn/server/server.conf
```
### 3. Paste the Following Configuration (replace YOUR_PUBLIC_IP with your server's actual public IP):

```bash
local YOUR_PUBLIC_IP
port 1195
proto udp
dev tun

# PQC PKI paths (these will be generated in the next step)
ca   /etc/openvpn/pqc-pki/ca.crt
cert /etc/openvpn/pqc-pki/server.crt
key  /etc/openvpn/pqc-pki/server.key
dh   /etc/openvpn/pqc-pki/dh.pem

# TLS hardening
tls-auth /etc/openvpn/pqc-pki/ta.key 0
tls-version-min 1.3

# Data channel cipher (AES-256-GCM is quantum-resistant)
cipher AES-256-GCM
auth SHA256

# Network settings (adjust internal subnet as needed)
server 10.9.0.0 255.255.255.0
push "route 192.168.30.0 255.255.255.0"

keepalive 10 120
persist-tun
user nobody
group nogroup

status /var/log/openvpn-pqc-status.log
verb 4
```
> **Note:** If your internal subnet differs, adjust the `push "route ..."` line accordingly.

## Public Key Infrastructure (PKI) Setup

Generate the certificates and keys using Easy-RSA.

### 1. Install Easy-RSA

```bash
sudo apt update
sudo apt install easy-rsa -y
```

### 2. Initialize the PKI Environment

```bash
make-cadir ~/easy-rsa
cd ~/easy-rsa
./easyrsa init-pki
```

### 3. Build the Certificate Authority (CA)

```bash
./easyrsa build-ca
```

> **Note:** When prompted, enter a CA passphrase and press **Enter** to leave the **Common Name** blank.

### 4. Generate the Server Certificate

```bash
./easyrsa gen-req server nopass
./easyrsa sign-req server server
```
---

# Generate Diffie-Hellman Parameters

Generate the Diffie-Hellman parameters required for secure key exchange.

```bash
./easyrsa gen-dh
```

---

# Deploy Certificates

Move the generated certificates and keys to the locations referenced in `server.conf`.

## 1. Create the Target Directory

Create the directory that will store all PKI assets.

```bash
sudo mkdir -p /etc/openvpn/pqc-pki
```

---

## 2. Copy Certificates

Copy the generated certificates and keys into the PKI directory.

```bash
sudo cp pki/ca.crt /etc/openvpn/pqc-pki/
sudo cp pki/issued/server.crt /etc/openvpn/pqc-pki/
sudo cp pki/private/server.key /etc/openvpn/pqc-pki/
sudo cp pki/dh.pem /etc/openvpn/pqc-pki/
```

---

## 3. Generate the TLS Authentication Key

Generate an additional TLS authentication key to protect against unauthorized connection attempts.

```bash
cd /etc/openvpn/pqc-pki

sudo openvpn --genkey secret /etc/openvpn/pqc-pki/ta.key

sudo chmod 600 /etc/openvpn/pqc-pki/ta.key

sudo chown root:root /etc/openvpn/pqc-pki/ta.key
```

---

## 4. Verify the Deployment

Verify that all required files exist.

```bash
ls -l /etc/openvpn/pqc-pki
```

> [!IMPORTANT]
> Your PKI directory should contain:
>
> - `ca.crt`
> - `server.crt`
> - `server.key`
> - `dh.pem`
> - `ta.key`

---

# Enable IP Forwarding and Firewall Rules

To allow VPN clients to communicate with internal networks, enable IPv4 forwarding and configure NAT.

## 1. Enable IP Forwarding

```bash
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

sudo sysctl -p
```

Verify that forwarding is enabled:

```bash
cat /proc/sys/net/ipv4/ip_forward
```

Expected output:

```text
1
```

---

## 2. Configure Firewall Rules

Configure NAT and forwarding rules.

```bash
sudo iptables -t nat -A POSTROUTING -s 10.9.0.0/24 -d 192.168.30.0/24 -j MASQUERADE

sudo iptables -A FORWARD -s 10.9.0.0/24 -d 192.168.30.0/24 -j ACCEPT

sudo iptables -A FORWARD -d 10.9.0.0/24 -s 192.168.30.0/24 -j ACCEPT
```

> [!NOTE]
> If your internal subnet differs, adjust the `POSTROUTING` and `FORWARD` rules accordingly.

---

## 3. Persist Firewall Rules

Save the firewall configuration so it survives a reboot.

```bash
sudo apt install iptables-persistent -y

sudo netfilter-persistent save
```

---

# Creating Client Configurations

Generate client certificates and prepare an `.ovpn` configuration file for each VPN client.

---

## 1. Generate Client Certificates

```bash
cd ~/easy-rsa

./easyrsa gen-req client1 nopass

./easyrsa sign-req client client1
```

---

## 2. Prepare the Client Configuration Directory

```bash
mkdir -p ~/client-configs/client1

cp pki/ca.crt ~/client-configs/client1/

cp pki/issued/client1.crt ~/client-configs/client1/

cp pki/private/client1.key ~/client-configs/client1/

sudo cp /etc/openvpn/pqc-pki/ta.key ~/client-configs/client1/

cd ~/client-configs/
```

---

## 3. Create the Client Configuration File

Create the client configuration.

```bash
nano ~/client-configs/client1/client1.ovpn
```

Paste the following configuration into the file.

```ovpn
client
dev tun
proto udp

remote YOUR_SERVER_IP 1195

resolv-retry infinite
nobind

persist-key
persist-tun

remote-cert-tls server
tls-version-min 1.3
tls-groups X25519MLKEM768
cipher AES-256-GCM
auth SHA256

key-direction 1

verb 4

<ca>
-----BEGIN CERTIFICATE-----
[PASTE YOUR CA CERTIFICATE HERE]
-----END CERTIFICATE-----
</ca>

<cert>
-----BEGIN CERTIFICATE-----
[PASTE YOUR CLIENT CERTIFICATE HERE]
-----END CERTIFICATE-----
</cert>

<key>
-----BEGIN PRIVATE KEY-----
[PASTE YOUR CLIENT PRIVATE KEY HERE]
-----END PRIVATE KEY-----
</key>

<tls-auth>
-----BEGIN OpenVPN Static key V1-----
[PASTE YOUR TA.KEY HERE]
-----END OpenVPN Static key V1-----
</tls-auth>
```

> [!IMPORTANT]
> Replace `YOUR_SERVER_IP` with your server's public IP address.

---

> [!TIP]
> Embed the certificate contents directly inside the `.ovpn` file instead of referencing external files. This creates a single portable client configuration.

---

## 4. Transfer the Client Configuration

Transfer the completed `.ovpn` file securely using one of the following methods:

- SCP
- SFTP
- USB Drive
- Secure Cloud Storage

Avoid sending VPN configuration files through unsecured messaging applications or email.

---

# Verification

## 1. Start the VPN Server

```bash
sudo /usr/local/sbin/openvpn --config /etc/openvpn/server/server.conf --verb 4
```

---

## 2. Test the Client Connection

1. Import the `.ovpn` file into the OpenVPN client.
2. Connect to the VPN.
3. Verify the VPN tunnel is established.
4. Ping the internal subnet:

```bash
sudo /opt/openvpn-pqc/sbin/openvpn --config ~/client1.ovpn
```

---

## 3. Check Logs

### Server Log

```text
/var/log/openvpn-pqc-status.log
```

### Client Logs

View the logs from within the OpenVPN client application.

> [!TIP]
> If the client cannot connect, compare both the client and server logs. Most TLS and certificate issues become immediately apparent.

---

# Contributing

Contributions are welcome!

If you discover bugs, have feature requests, or would like to improve the documentation, feel free to:

- Open an Issue
- Submit a Pull Request
- Suggest Improvements

---

# License

This project is licensed under the **MIT License**.

See the `LICENSE` file for additional information.

---

# References

- OpenVPN Documentation
- Easy-RSA Documentation
- OpenSSL 3.x PQC Support

---

## Happy Secure Networking! 🛡️

Thank you for using this project.

If you found it useful, consider giving the repository a ⭐ on GitHub.

---