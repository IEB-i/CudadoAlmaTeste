const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Webhook para receber notificações de pagamento do PagBank / PagSeguro
 */
app.post("/", async (req, res) => {
    try {
        console.log("Recebendo notificação do PagSeguro:", JSON.stringify(req.body, null, 2));

        const body = req.body || {};
        let referenceId = null;
        let isPaid = false;
        let paymentId = body.id || null;
        let rawStatus = null;

        // 1. Formato PagBank API v3 (JSON com charges ou reference_id)
        if (body.reference_id) {
            referenceId = body.reference_id;
        }

        if (Array.isArray(body.charges) && body.charges.length > 0) {
            const charge = body.charges[0];
            rawStatus = charge.status;
            paymentId = charge.id || paymentId;
            if (charge.reference_id && !referenceId) {
                referenceId = charge.reference_id;
            }
            if (rawStatus === "PAID" || rawStatus === "AUTHORIZED") {
                isPaid = true;
            }
        } else if (body.status) {
            rawStatus = body.status;
            if (rawStatus === "PAID" || rawStatus === "PAGA" || rawStatus === "3") {
                isPaid = true;
            }
        }

        // 2. Se tivermos o referenceId (ID do documento da inscrição no Firestore)
        if (referenceId) {
            console.log(`Buscando inscrição com ID/Referência: ${referenceId}`);
            const docRef = db.collection("Eventos").doc("Conf2026").collection("inscricoes").doc(referenceId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                if (isPaid) {
                    await docRef.update({
                        statusPagamento: "pago",
                        dtPagamento: admin.firestore.FieldValue.serverTimestamp(),
                        pagseguroId: paymentId,
                        pagseguroStatus: rawStatus,
                        ultimaAtualizacaoWebhook: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`Inscrição ${referenceId} atualizada com sucesso para STATUS: PAGO`);
                } else {
                    await docRef.update({
                        pagseguroId: paymentId,
                        pagseguroStatus: rawStatus,
                        ultimaAtualizacaoWebhook: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`Inscrição ${referenceId} atualizada com status PagSeguro: ${rawStatus}`);
                }
            } else {
                console.warn(`Inscrição com ID ${referenceId} não encontrada na coleção Eventos/Conf2026/inscricoes.`);
            }
        } else {
            console.warn("Nenhum reference_id identificado no corpo da requisição.");
        }

        // O PagSeguro sempre espera um status 200 OK para confirmar o recebimento
        return res.status(200).send("OK");
    } catch (error) {
        console.error("Erro ao processar webhook do PagSeguro:", error);
        return res.status(200).send("Erro processado");
    }
});

// Exporta a função HTTPS com v2 (2nd Generation)
exports.pagseguroWebhook = onRequest({
    cors: true,
    invoker: "public"
}, app);

/**
 * Função para criar o Checkout Dinâmico no PagBank
 */
const appCheckout = express();
appCheckout.use(cors({ origin: true }));
appCheckout.use(express.json());

appCheckout.post("/", async (req, res) => {
    try {
        const { inscricaoId, nome, celular } = req.body;

        if (!inscricaoId) {
            return res.status(400).json({ error: "inscricaoId é obrigatório." });
        }

        // Substitua pelo seu Token de Produção ou Sandbox do PagBank
        // Você pode obter o token em: https://pagseguro.uol.com.br/painel/integracao/tokens
        const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN || "c9ee2636-ffbe-46d0-b505-cd7218a9ccdbb6c50da34668828b8247d5aaed5ad5f3bd4d-3ac3-4156-80ce-ab4e6f8cac1e"; 
        
        // Use 'https://sandbox.api.pagseguro.com/checkouts' para testes
        const PAGBANK_URL = "https://api.pagseguro.com/checkouts";

        const payload = {
            reference_id: inscricaoId,
            customer: {
                name: nome,
                phones: [
                    {
                        country: "55",
                        area: celular.replace(/\D/g, '').substring(0, 2),
                        number: celular.replace(/\D/g, '').substring(2),
                        type: "MOBILE"
                    }
                ]
            },
            items: [
                {
                    reference_id: "ingresso_conf2026",
                    name: "Inscrição - Cuidado da Alma",
                    quantity: 1,
                    unit_amount: 5000 // R$ 50,00 em centavos
                }
            ],
            payment_methods: [
                { type: "CREDIT_CARD" },
                { type: "PIX" }
                // Pode adicionar "BOLETO" se desejar
            ],
            redirect_url: "https://seu-site.com.br/sucesso.html" // Opcional: para onde o usuário volta após pagar
        };

        const response = await fetch(PAGBANK_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${PAGBANK_TOKEN}`,
                "Content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro no PagBank:", data);
            return res.status(500).json({ error: "Falha ao criar o checkout no PagBank", details: data });
        }

        // Encontra o link de pagamento
        const payLink = data.links.find(link => link.rel === "PAY" || link.rel === "pay");
        
        if (payLink && payLink.href) {
            return res.status(200).json({ url: payLink.href });
        } else {
            return res.status(500).json({ error: "Link de pagamento não retornado pelo PagBank." });
        }

    } catch (error) {
        console.error("Erro interno ao gerar checkout:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

exports.criarCheckout = onRequest({
    cors: true,
    invoker: "public"
}, appCheckout);
