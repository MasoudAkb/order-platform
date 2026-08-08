import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";

import { getDb } from "../../database/db";

import {
  servicePrices
} from "../../database/schema";


import { authMiddleware } from "../../middleware/auth";
import { adminMiddleware } from "../../middleware/admin";


const services = new Hono();



services.use("*", authMiddleware);
services.use("*", adminMiddleware);





// لیست قیمت‌ها
// GET /admin/services

services.get("/", async(c)=>{


  const db = getDb(c.env);


  const result = await db
    .select()
    .from(servicePrices)
    .orderBy(
      desc(servicePrices.id)
    );



  return c.json({

    success:true,

    services:result

  });


});








// مشاهده یک سرویس
// GET /admin/services/:type

services.get("/:type", async(c)=>{


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



  if(!service){

    return c.json({

      success:false,

      message:"Service not found"

    },404);

  }



  return c.json({

    success:true,

    service

  });


});









// تغییر قیمت و عنوان
// PATCH /admin/services/:type

services.patch("/:type", async(c)=>{


  const db = getDb(c.env);


  const type = c.req.param("type");



  let body;


  try {

    body = await c.req.json();

  } catch {

    return c.json({

      success:false,

      message:"Invalid JSON"

    },400);

  }



  const updateData = {};



  if(body.basePrice !== undefined){

    const price = Number(body.basePrice);


    if(!price || price <=0){

      return c.json({

        success:false,

        message:"Invalid price"

      },400);

    }


    updateData.basePrice = price;

  }




  if(body.title){

    updateData.title = body.title;

  }



  updateData.updatedAt = Date.now();





  const result = await db
    .update(servicePrices)
    .set(updateData)
    .where(
      eq(
        servicePrices.serviceType,
        type
      )
    )
    .returning();





  if(!result[0]){

    return c.json({

      success:false,

      message:"Service not found"

    },404);

  }




  return c.json({

    success:true,

    service:result[0]

  });


});









// اضافه کردن سرویس جدید
// POST /admin/services

services.post("/", async(c)=>{


  const db = getDb(c.env);



  let body;


  try {

    body = await c.req.json();

  } catch {

    return c.json({

      success:false,

      message:"Invalid JSON"

    },400);

  }




  const {
    serviceType,
    title,
    basePrice
  } = body;





  if(!serviceType || !title || !basePrice){

    return c.json({

      success:false,

      message:"serviceType title basePrice required"

    },400);

  }





  const now = Date.now();




  const result = await db
    .insert(servicePrices)
    .values({

      serviceType,

      title,

      basePrice:Number(basePrice),

      updatedAt:now

    })
    .returning();





  return c.json({

    success:true,

    service:result[0]

  });



});



export default services;