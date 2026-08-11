import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { getDb } from "../database/db";

import {
    servicePrices
} from "../database/schema";

const services = new Hono();

// =====================================================
// GET /services
// دریافت لیست سرویس‌ها
// =====================================================
services.get("/", async (c) => {
    const db = getDb(c.env);

    const result = await db
        .select({
            id: servicePrices.id,
            serviceType: servicePrices.serviceType,
            title: servicePrices.title,
            basePrice: servicePrices.basePrice,
            updatedAt: servicePrices.updatedAt,
        })
        .from(servicePrices);

    return c.json({
        success: true,
        services: result
    });
});
// =====================================================
// GET /services/:type
// دریافت اطلاعات یک سرویس
// =====================================================

services.get("/:type", async (c) => {

    const db = getDb(c.env);

    const type = c.req.param("type");

    const result = await db
        .select()
        .from(servicePrices)
        .where(
            eq(
                servicePrices.serviceType,
                type
            )
        );

    const service = result[0];

    if (!service) {

        return c.json({
            success: false,
            message: "Service not found"
        }, 404);

    }

    return c.json({
        success: true,
        service
    });

});


// =====================================================
// GET /services/:type/price
// =====================================================

services.get("/:type/price", async (c) => {

    const db = getDb(c.env);

    const type = c.req.param("type");

    const result = await db
        .select()
        .from(servicePrices)
        .where(
            eq(
                servicePrices.serviceType,
                type
            )
        );

    const service = result[0];

    if (!service) {

        return c.json({
            success: false,
            message: "Service not found"
        }, 404);

    }

    return c.json({
        success: true,
        serviceType: service.serviceType,
        title: service.title,
        basePrice: service.basePrice
    });

});


// =====================================================
// POST /services/quote
// =====================================================

services.post("/quote", async (c) => {

    const db = getDb(c.env);

    let body;

    try {

        body = await c.req.json();

    } catch {

        return c.json({
            success: false,
            message: "Invalid JSON"
        }, 400);

    }

    const {
        serviceType
    } = body;

    if (!serviceType) {

        return c.json({
            success: false,
            message: "serviceType required"
        }, 400);

    }

    const result = await db
        .select()
        .from(servicePrices)
        .where(
            eq(
                servicePrices.serviceType,
                serviceType
            )
        );

    const service = result[0];

    if (!service) {

        return c.json({
            success: false,
            message: "Service not found"
        }, 404);

    }

    return c.json({
        success: true,
        service: {
            type: service.serviceType,
            title: service.title,
            price: service.basePrice
        }
    });

});


export default services;