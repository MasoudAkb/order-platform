# Project V1 — Functional Roadmap

## هدف نسخه اول

هدف V1 این است که تمام قابلیت‌های اصلی پروژه از نظر **Backend، Database و Frontend** پیاده‌سازی و قابل استفاده باشند.

در این نسخه تمرکز روی عملکرد و کامل بودن سیستم است و **زیباسازی و طراحی حرفه‌ای رابط کاربری انجام نمی‌شود**.

---

# 1. Users — مدیریت کاربران

## قابلیت‌های مورد نیاز

### Admin

* ورود ادمین
* مشاهده لیست کاربران
* ایجاد کاربر جدید
* تعیین نام کاربری
* تعیین رمز عبور
* ثبت نام و شماره تماس
* فعال / غیرفعال کردن کاربر
* تغییر اطلاعات کاربر
* تغییر رمز عبور کاربر
* مشاهده سفارش‌های هر کاربر

### User

* ورود به حساب
* مشاهده اطلاعات حساب خود
* مشاهده سفارش‌های خود
* مشاهده جزئیات سفارش
* مشاهده پیام‌های مربوط به سفارش
* مشاهده وضعیت سفارش

## Roles

سیستم حداقل دو نقش داشته باشد:

```text
admin
user
```

ساختار Users باید از ابتدا طوری طراحی شود که در آینده امکان اضافه کردن Roleهای بیشتر وجود داشته باشد.

---

# 2. Authentication

## Login

سیستم باید امکان ورود کاربران و ادمین را داشته باشد.

احراز هویت باید در Backend انجام شود و Frontend فقط وضعیت Login را مدیریت کند.

## Middleware

مسیرهای محافظت‌شده باید از Middleware احراز هویت استفاده کنند.

نمونه:

```text
authMiddleware
adminMiddleware
```

### قوانین

* User به APIهای Admin دسترسی نداشته باشد.
* Admin بتواند APIهای مدیریتی را استفاده کند.
* User فقط اطلاعات خودش را مشاهده کند.
* اطلاعات سایر کاربران نباید برای User قابل مشاهده باشد.

---

# 3. Services — مدیریت سرویس‌ها

هر سرویس باید در Database تعریف شود.

اطلاعات اصلی سرویس:

```text
serviceType
title
basePrice
status
createdAt
updatedAt
```

## قابلیت‌های Admin

* مشاهده سرویس‌ها
* ایجاد سرویس جدید
* تغییر عنوان
* تغییر قیمت
* فعال / غیرفعال کردن سرویس

## نمونه سرویس‌ها

```text
apple_id
apple_id_with_email
```

در آینده امکان اضافه شدن سرویس‌های بیشتر وجود داشته باشد.

---

# 4. Dynamic Service Forms

فرم سفارش باید بر اساس نوع سرویس تغییر کند.

مثلاً:

## Apple ID

فیلدهای ممکن:

```text
fullName
phone
```

فیلدهای زیر می‌توانند خالی باشند:

```text
email
password
birthDate
security1
security2
security3
```

---

## Apple ID With Email

فیلدهای:

```text
email
fullName
phone
password
birthDate
security1
security2
security3
```

می‌توانند بر اساس نیاز سرویس Required یا Optional باشند.

### نکته مهم

Required بودن فیلدها نباید فقط در Frontend کنترل شود.

Backend نیز باید بر اساس `serviceType` قوانین اعتبارسنجی مربوط به همان سرویس را اعمال کند.

---

# 5. Orders — سفارش‌ها

هر سفارش باید حداقل شامل موارد زیر باشد:

```text
id
userId
serviceType / title
price
status
paymentStatus
createdAt
updatedAt
approvedAt
completedAt
rejectReason
```

## وضعیت سفارش

```text
pending
processing
completed
rejected
cancelled
```

### جریان اصلی سفارش

```text
User
 ↓
Create Order
 ↓
pending
 ↓
Admin Review
 ├── Reject → rejected
 │
 └── Approve
       ↓
    processing
       ↓
    completed
```

---

# 6. Order Details

اطلاعات اختصاصی هر سرویس باید در `orderDetails` ذخیره شود.

مثلاً:

```json
{
  "fullName": "...",
  "phone": "...",
  "email": "...",
  "password": "...",
  "birthDate": "...",
  "security1": "...",
  "security2": "...",
  "security3": "..."
}
```

اطلاعاتی که برای یک سرویس استفاده نمی‌شوند می‌توانند خالی باشند یا اصلاً ارسال نشوند.

---

# 7. Admin Order Management

Admin باید بتواند:

* مشاهده تمام سفارش‌ها
* مشاهده سفارش‌های Pending
* مشاهده سفارش‌های Processing
* مشاهده سفارش‌های Completed
* مشاهده سفارش‌های Rejected
* فیلتر سفارش‌ها بر اساس وضعیت
* مشاهده جزئیات سفارش
* مشاهده اطلاعات مشتری
* مشاهده قیمت سفارش
* تأیید سفارش
* رد سفارش
* ثبت دلیل رد
* تکمیل سفارش
* ثبت نتیجه سفارش
* مشاهده تاریخچه وضعیت سفارش

---

# 8. Order Status History

هر تغییر وضعیت باید در تاریخچه ذخیره شود.

نمونه:

```text
pending → processing
processing → completed
pending → rejected
```

اطلاعات History:

```text
orderId
oldStatus
newStatus
createdAt
```

این بخش برای بررسی سابقه سفارش در آینده بسیار مهم است.

---

# 9. Messages

هر سفارش می‌تواند پیام داشته باشد.

ساختار کلی:

```text
orderId
senderId
receiverId
message
createdAt
```

## Admin

Admin بتواند برای سفارش پیام ارسال کند.

## User

User بتواند پیام‌های مربوط به سفارش خودش را مشاهده کند.

---

# 10. Order Result

هنگام تکمیل سفارش، Admin بتواند نتیجه سفارش را ثبت کند.

مثلاً:

```text
اطلاعات Apple ID آماده شد.
```

این نتیجه باید همراه سفارش ذخیره شود.

---

# 11. Payments

در V1 ساختار پرداخت باید آماده باشد، حتی اگر درگاه واقعی هنوز پیاده‌سازی نشده باشد.

وضعیت پرداخت:

```text
unpaid
pending
paid
failed
refunded
```

ساختار سفارش نباید به شکلی باشد که اضافه کردن درگاه پرداخت در V2 نیاز به بازطراحی کامل داشته باشد.

---

# 12. Notifications

ساختار Notification باید از ابتدا قابل توسعه باشد.

رویدادهای مهم:

### سفارش جدید

```text
User → Order Created → Admin Notification
```

### تأیید سفارش

```text
Admin → Approve → User Notification
```

### رد سفارش

```text
Admin → Reject → User Notification
```

### تکمیل سفارش

```text
Admin → Complete → User Notification
```

### پیام جدید

```text
New Message → Receiver Notification
```

OneSignal می‌تواند برای Push Notification استفاده شود.

---

# 13. Push Subscriptions

هر User یا Admin می‌تواند Push Subscription داشته باشد.

ساختار:

```text
subscriptionId
userId
role
createdAt
updatedAt
```

یک کاربر می‌تواند در آینده چند Subscription داشته باشد.

---

# 14. Frontend Pages — V1

در V1 تمام قابلیت‌های اصلی باید در Frontend قابل دسترسی باشند.

## Public

```text
/
 /login
```

---

## User

```text
/orders
/orders/:id
/services
/service/:type
/profile
```

### User باید بتواند:

* Login
* مشاهده سرویس‌ها
* انتخاب سرویس
* تکمیل فرم سرویس
* ثبت سفارش
* مشاهده سفارش‌ها
* مشاهده جزئیات سفارش
* مشاهده وضعیت
* مشاهده پیام‌ها
* مشاهده نتیجه سفارش
* مشاهده پروفایل

---

## Admin

```text
/admin
/admin/users
/admin/users/:id
/admin/services
/admin/orders
/admin/orders/:id
/admin/messages
```

### Admin باید بتواند:

* مشاهده Dashboard
* مدیریت کاربران
* مدیریت سرویس‌ها
* مدیریت سفارش‌ها
* مشاهده جزئیات سفارش
* تغییر وضعیت سفارش
* ارسال پیام
* مشاهده تاریخچه
* مدیریت قیمت سرویس‌ها

---

# 15. API Structure

ساختار API باید از ابتدا منظم و قابل توسعه باشد.

## Authentication

```text
POST /auth/login
POST /auth/logout
GET  /auth/me
```

## Users

```text
GET    /admin/users
GET    /admin/users/:id
POST   /admin/users
PATCH  /admin/users/:id
DELETE /admin/users/:id
```

## Services

```text
GET   /services/:type
GET   /services/:type/price
POST  /services/quote

GET   /admin/services
GET   /admin/services/:type
POST  /admin/services
PATCH /admin/services/:type
```

## Orders

```text
GET  /orders
GET  /orders/:id
POST /orders
```

## Admin Orders

```text
GET  /admin/orders
GET  /admin/orders/:id

POST /admin/orders/:id/approve
POST /admin/orders/:id/reject
POST /admin/orders/:id/complete
```

## Messages

```text
GET  /orders/:id/messages
POST /orders/:id/messages

GET  /admin/orders/:id/messages
POST /admin/orders/:id/messages
```

---

# 16. Database Structure

ساختار کلی مورد انتظار:

```text
users
services / service_prices
orders
order_details
order_status_history
messages
push_subscriptions
```

ارتباط اصلی:

```text
users
  │
  ├──── orders
  │       │
  │       ├──── order_details
  │       ├──── order_status_history
  │       └──── messages
  │
  └──── push_subscriptions
```

---

# 17. Security

در V1 موارد زیر باید رعایت شوند:

* Passwordها به صورت Plain Text ذخیره نشوند.
* APIهای Admin محافظت شوند.
* User نتواند Order متعلق به User دیگر را مشاهده کند.
* User نتواند Order متعلق به User دیگر را تغییر دهد.
* اعتبارسنجی اطلاعات در Backend انجام شود.
* اطلاعات حساس سفارش فقط برای افراد مجاز نمایش داده شود.
* قیمت سفارش از اطلاعات ارسالی Frontend قابل اعتماد نباشد.
* قیمت نهایی از Database/Backend تعیین شود.

---

# 18. V1 Testing

قبل از پایان V1 این سناریوها باید تست شوند.

## User

* [ ] Login
* [ ] مشاهده سرویس‌ها
* [ ] انتخاب سرویس
* [ ] ارسال فرم
* [ ] ثبت سفارش
* [ ] مشاهده سفارش
* [ ] مشاهده وضعیت
* [ ] مشاهده پیام
* [ ] مشاهده نتیجه

## Admin

* [ ] Login
* [ ] مشاهده کاربران
* [ ] ایجاد کاربر
* [ ] ویرایش کاربر
* [ ] غیرفعال کردن کاربر
* [ ] مشاهده سفارش‌ها
* [ ] فیلتر سفارش‌ها
* [ ] تأیید سفارش
* [ ] رد سفارش
* [ ] ثبت دلیل رد
* [ ] تکمیل سفارش
* [ ] ثبت نتیجه
* [ ] ارسال پیام
* [ ] مشاهده History

## Services

* [ ] ایجاد سرویس
* [ ] تغییر قیمت
* [ ] تغییر عنوان
* [ ] فعال/غیرفعال کردن سرویس
* [ ] نمایش قیمت صحیح در Frontend
* [ ] فرم متفاوت برای سرویس‌های مختلف

---

# 19. خارج از محدوده V1

موارد زیر عمداً برای V2 هستند:

* طراحی حرفه‌ای UI
* طراحی Dashboard حرفه‌ای
* انیمیشن‌ها
* Loadingهای حرفه‌ای
* Responsive Design کامل
* Dark Mode
* طراحی کارت‌های حرفه‌ای
* UX پیشرفته
* Toastهای حرفه‌ای
* Modalهای حرفه‌ای
* بهینه‌سازی ظاهری فرم‌ها
* طراحی Mobile UI
* Design System
* Branding کامل

---

# 20. V2 — UI/UX

بعد از اینکه تمام قابلیت‌های V1 کامل و تست شد، وارد V2 می‌شویم.

تمرکز V2:

```text
UI
UX
Responsive
Performance
Accessibility
Animations
Dashboard Design
Mobile Experience
```

---

# 21. Definition of Done — V1

V1 زمانی کامل محسوب می‌شود که:

* [ ] Authentication کامل باشد.
* [ ] Users کامل باشند.
* [ ] Roles کامل باشند.
* [ ] Services قابل مدیریت باشند.
* [ ] Dynamic Service Forms کار کنند.
* [ ] Orders کامل باشند.
* [ ] Admin Order Management کامل باشد.
* [ ] Order Details کامل باشد.
* [ ] Status History کار کند.
* [ ] Messages کار کنند.
* [ ] Order Result کار کند.
* [ ] Payment Status در ساختار وجود داشته باشد.
* [ ] Push Subscription ساختار مناسبی داشته باشد.
* [ ] Notifications قابل اتصال باشند.
* [ ] تمام APIهای اصلی تست شوند.
* [ ] تمام صفحات اصلی Frontend وجود داشته باشند.
* [ ] محدودیت دسترسی User/Admin درست کار کند.
* [ ] اطلاعات حساس محافظت شوند.
* [ ] هیچ قابلیت اصلی پروژه فقط در Backend وجود نداشته باشد و برای آن UI/Flow مناسب در Frontend وجود داشته باشد.

---

# Project Development Strategy

## Version 1

**Functional Complete**

```text
Database
    ↓
Backend API
    ↓
Authentication
    ↓
Frontend Functionality
    ↓
Testing
    ↓
V1 Release
```

## Version 2

**Professional UI/UX**

```text
Existing V1
    ↓
UI Redesign
    ↓
UX Improvements
    ↓
Responsive Design
    ↓
Performance
    ↓
Polish
    ↓
V2 Release
```

---

## اصل اصلی پروژه

> در V1 اول «کار کردن سیستم» مهم است، نه «زیبا بودن سیستم».

تا زمانی که تمام قابلیت‌های اصلی از Database تا API و Frontend کامل و تست نشده‌اند، نباید زمان زیادی صرف زیباسازی کنیم.
