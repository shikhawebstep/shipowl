import axios from 'axios';
import { logMessage } from '../commonUtils';

const NEXT_PUBLIC_SHOPIFY_API_VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION;

interface Money {
  amount: string;
  currencyCode: string;
}

interface Address {
  address1: string;
  address2: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
}

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface LineItem {
  title: string;
  sku: string;
  quantity: number;
  discountedTotalSet: {
    shopMoney: Money;
  };
  originalTotalSet: {
    shopMoney: Money;
  };
}

interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  currencyCode: string;
  totalPriceSet: { shopMoney: Money };
  subtotalPriceSet: { shopMoney: Money };
  totalShippingPriceSet: { shopMoney: Money };
  totalTaxSet: { shopMoney: Money };
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  customer: Customer;
  billingAddress: Address;
  shippingAddress: Address;
  lineItems: {
    edges: {
      node: LineItem;
    }[];
  };
}

interface OrdersResult {
  status: boolean;
  message?: string;
  orders?: ShopifyOrder[];
  details?: unknown;
}

interface GraphQLEdge {
  node: ShopifyOrder;
}

interface ShopifyGraphQLResponse {
  data: {
    orders: {
      edges: GraphQLEdge[];
    };
  };
  errors?: unknown;
}

export async function fetchShopifyStoreOrders(shop: string, access_token: string): Promise<OrdersResult> {
  if (!shop || !access_token) {
    logMessage('warn', 'Missing shop or access token', { shop });
    return {
      status: false,
      message: 'Missing shop or access token',
    };
  }

  const gql = `{
      orders(first: 10, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            currencyCode
            totalPriceSet { shopMoney { amount currencyCode } }
            subtotalPriceSet { shopMoney { amount currencyCode } }
            totalShippingPriceSet { shopMoney { amount currencyCode } }
            totalTaxSet { shopMoney { amount currencyCode } }
            displayFinancialStatus
            displayFulfillmentStatus
            customer {
              id
              email
              firstName
              lastName
              phone
            }
            billingAddress {
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            shippingAddress {
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            lineItems(first: 50) {
              edges {
                node {
                  title
                  sku
                  quantity
                  discountedTotalSet { shopMoney { amount currencyCode } }
                  originalTotalSet { shopMoney { amount currencyCode } }
                }
              }
            }
          }
        }
      }
    }`;

  try {
    const response = await axios.post<ShopifyGraphQLResponse>(
      `https://${shop}/admin/api/${NEXT_PUBLIC_SHOPIFY_API_VERSION}/graphql.json`,
      { query: gql },
      { headers: { 'X-Shopify-Access-Token': access_token } }
    );

    if (response.data.errors) {
      logMessage('error', 'Shopify GraphQL errors', response.data.errors);
      return {
        status: false,
        message: 'GraphQL errors from Shopify',
        details: response.data.errors,
      };
    }

    const orders = response.data.data.orders.edges.map((edge) => edge.node);
    logMessage('info', 'Orders fetched successfully', { count: orders.length });
    return {
      status: true,
      message: 'Fetched orders successfully',
      orders,
    };
  } catch (error: unknown) {
    logMessage('error', 'Fetch orders error', { error });
    return {
      status: false,
      message: 'Failed to fetch orders',
      details: error,
    };
  }
}
