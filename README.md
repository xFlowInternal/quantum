# Quantum

> A collection of quantum computing, quantum cryptography, post-quantum cryptography, and cybersecurity projects developed for research, education, and experimentation.

---

## About

This repository serves as a centralized collection of projects exploring **quantum computing**, **quantum information science**, **post-quantum cryptography (PQC)**, **secure communication**, and **interactive educational visualizations**.

The projects range from algorithm implementations using **IBM Qiskit**, browser-based visual learning tools, and cryptographic demonstrations to full-scale secure communication systems and post-quantum VPN deployments. Each project is designed to provide practical implementations alongside educational resources for students, researchers, developers, and cybersecurity professionals.

---

# Repository Structure

```
Quantum/
│
├── Qiskit-Quantum-Experiments/
├── Quantum-Concepts-Visualization/
├── QVPN/
├── ECC-Visualizer/
├── quantum-vault/
└── mlkem-webapp/
```

---

# Projects

## 1. Qiskit Quantum Experiments

It is a collection of quantum computing projects and experiments developed using ***Qiskit***. The repository includes implementations of quantum algorithms such as ***QAOA*** and ***HHL***, ***Bloch sphere visualization utilities***, quantum circuit examples, and supporting analysis scripts. Designed for both learning and research, it provides practical, reproducible examples that help users explore quantum computing concepts, algorithm development, and real-world applications using IBM's Qiskit framework.

📂 **Project:** [Qiskit Quantum Experiments](./Qiskit-Quantum-Experiments)

---

## 2. Quantum Concepts Visualization

Quantum Optics & Quantum Information Visualizations is a collection of interactive, browser-based HTML animations designed to make fundamental concepts in quantum optics and quantum information easier to understand through visual learning. The repository includes simulations of topics such as the ***BB84 Quantum Key Distribution*** protocol, ***beam splitters***, ***optical qubits***, ***prism refraction***, and ***time-bin encoding***, providing an intuitive way for students, educators, and researchers to explore the principles underlying quantum communication, quantum computing, and photonic quantum systems without requiring any additional software or dependencies.

📂 **Project:** [Quantum Concepts Visualization](./Quantum-Concepts-Visualization)

---

## 3. Quantum-Safe VPN (QVPN)

this Deployment Guide is a comprehensive guide for building and deploying an ***OpenVPN-based Virtual Private Network*** enhanced with ***post-quantum cryptography (PQC)***. It provides step-by-step instructions for compiling OpenVPN with ***OpenSSL 3.x support***, configuring a ***hybrid X25519MLKEM768 key exchange***, setting up a complete Public Key Infrastructure (PKI) using ***Easy-RSA***, deploying server and client configurations, and enabling secure VPN connectivity with IP forwarding, firewall rules, and verification procedures. Designed for researchers, cybersecurity professionals, and system administrators, this guide serves as a practical reference for implementing quantum-resistant VPN infrastructure.

📂 **Project:** [Quantum-Safe VPN](./QVPN)

---

## 4. ECC Visualizer

ECC Secure Chat Application is a real-time, end-to-end encrypted messaging application that demonstrates the practical implementation of ***Elliptic Curve Cryptography (ECC)*** for secure communication. The project combines ***ECDH key exchange***, AES-GCM encryption, WebSocket-based messaging, and ***interactive visualizations of elliptic curves and cryptographic operations*** to help users understand how modern public-key cryptography works. Designed for students, educators, and cybersecurity enthusiasts, it serves as both an educational tool and a functional prototype for exploring secure communication using ECC.

📂 **Project:** [ECC Visualizer](./ECC-Visulizer)

---

## 5. Quantum Vault

Quantum Vault is a quantum-resistant secure messaging platform that combines classical and ***post-quantum cryptography*** to provide robust, end-to-end encrypted communication. The project integrates ***hybrid key exchange*** using ***ECC*** and ***ML-KEM-768***, digital signatures with ***ML-DSA-65***, ***AES-GCM-256*** encryption, ***quantum random number generation***, and modern web technologies to deliver a secure, scalable chat application. Designed for researchers, cybersecurity professionals, and developers, it serves as a practical implementation of post-quantum cryptographic standards while showcasing secure software architecture, automated security testing, and production-ready DevSecOps practices.

📂 **Project:** [Quantum Vault](./quantum-vault)

---

## 6. ML-KEM Web Application

ML-KEM Web Application is an interactive educational platform that demonstrates the complete key generation and key encapsulation process of the ***FIPS 203 ML-KEM*** (formerly CRYSTALS-Kyber) post-quantum cryptographic standard. Built with a Go backend and a React TypeScript frontend, the application provides step-by-step visualizations of algorithms such as ***SHA3, SHAKE, Number Theoretic Transform (NTT), Module-LWE, and key serialization***, allowing users to explore the internal workings of ***post-quantum key establishment*** through an intuitive, browser-based interface. Designed for students, researchers, and cybersecurity professionals, it serves as both a practical implementation and an educational resource for understanding NIST-standardized quantum-resistant cryptography.

📂 **Project:** [ML-KEM Web Application](./mlkem-webapp)

---

# Technology Stack

### Quantum Computing

- IBM Qiskit
- Qiskit Runtime
- QAOA
- HHL
- Quantum Circuits

### Post-Quantum Cryptography

- ML-KEM
- ML-DSA
- Module-LWE
- NTT
- SHA3
- SHAKE

### Classical Cryptography

- ECC
- ECDH
- AES-GCM
- TLS 1.3

### Networking

- OpenVPN
- PKI
- Easy-RSA
- Linux Networking
- iptables

### Web Technologies

- React
- Node.js
- Go
- HTML5
- CSS3
- JavaScript
- TypeScript
- Socket.IO

---

# License

This repository is licensed under the **MIT License**.

See the `LICENSE` file for details.

---

## Contributing

Contributions, suggestions, and improvements are always welcome.

Feel free to:

- Report issues
- Submit pull requests
- Improve documentation
- Suggest new quantum projects

---

## ⭐ Support

If you find these projects useful for your learning or research, consider giving the repository a **star**. It helps others discover the project and supports future development.