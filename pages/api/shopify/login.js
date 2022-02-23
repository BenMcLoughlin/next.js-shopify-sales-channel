import Shopify, { ApiVersion } from '@shopify/shopify-api';
import { PrismaClient } from '@prisma/client';
import { Session } from '@shopify/shopify-api/dist/auth/session';

const prisma = new PrismaClient({ log: ['info', 'warn', 'error'] });

async function storeCallback(session) {
    const payload = { ...session };
    return prisma.appSession
        .upsert({
            create: { id: session.id, payload: payload },
            update: { payload: payload },
            where: { id: session.id }
        })
        .then((_) => {
            return true;
        })
        .catch((err) => {
            return false;
        });
}

async function loadCallback(id) {
    return prisma.appSession
        .findUnique({
            where: { id: id }
        })
        .then((data) => {
            if (!data) {
                return undefined;
            }

            const session = new Session(data.id);
            // @ts-ignore
            const { shop, state, scope, accessToken, isOnline, expires, onlineAccessInfo } = data.payload;
            session.shop = shop;
            session.state = state;
            session.scope = scope;
            session.expires = expires ? new Date(expires) : undefined;
            session.isOnline = isOnline;
            session.accessToken = accessToken;
            session.onlineAccessInfo = onlineAccessInfo;
            return session;
        })
        .catch((err) => {
            return undefined;
        });
}

async function deleteCallback(id) {
    return prisma.appSession
        .delete({
            where: { id: id }
        })
        .then((_) => {
            return true;
        })
        .catch((err) => {
            return false;
        });
}

export const SqlSessionStorage = new Shopify.Session.CustomSessionStorage(storeCallback, loadCallback, deleteCallback);

const login = async (req, res) => {
    const context = {
        API_KEY: process.env.NEXT_PUBLIC_SHOPIFY_APP_API_KEY,
        API_SECRET_KEY: process.env.SHOPIFY_APP_API_SECRET_KEY,
        SCOPES: [process.env.SCOPES || 'write_products'],
        HOST_NAME: process.env.HOST || 'https://example.com',
        IS_EMBEDDED_APP: true,
        API_VERSION: ApiVersion.July21, // all supported versions are available, as well as "unstable" and "unversioned"
        SESSION_STORAGE: SqlSessionStorage
    };

    Shopify.Context.initialize(context);

    const authRoute = await Shopify.Auth.beginAuth(req, res, req.query.shop, '/api/shopify/getAccessToken', false);

    res.redirect(authRoute);

    res.send('BANAAN');
};

export default login;
