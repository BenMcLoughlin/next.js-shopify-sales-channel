import { Shopify } from '@shopify/shopify-api';

const getAccessToken = async (req, res) => {
    const shopSession = await Shopify.Auth.validateAuthCallback(req, res, req.query);

    const client = new Shopify.Clients.Rest(shopSession.shop, shopSession.accessToken);

    const data = await client.post({
        path: 'storefront_access_tokens',
        data: { storefront_access_token: { title: 'Test' } },
        type: 'application/json'
    });

    console.log('/index.js - data: ', data);

    res.redirect(`https://${shopSession.shop}/admin/apps/my-next-js-channel`);
};

export default getAccessToken;
