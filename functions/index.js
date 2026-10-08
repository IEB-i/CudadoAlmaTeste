const functions = require("firebase-functions");
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
        // Retornamos 200 para evitar reenvios infinitos em caso de dados inválidos
        return res.status(200).send("Erro processado");
    }
});

// Exporta a função HTTPS com o nome pagseguroWebhook
exports.pagseguroWebhook = functions.https.onRequest(app);
