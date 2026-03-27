# OPERATIONS_PORTAL.md

## Purpose

The Howeth & Harp operations portal is a simple internal management system used to control key website content without editing code manually. Its job is to support the public `howethandharp.com` site by giving the team a fast, functional way to manage projects, pricing, and listing status.

The portal is **admin-first, utility-first, and low-design**. It should prioritize speed, clarity, and reliability over visual polish.

---

## Core Relationship to the Public Website

The backend portal acts as the content control layer for the public website.

Changes made in the portal should update the live site data for these sections:

* **Projects / Catalog page**
* **Individual project entries**
* **Home availability status** (`For Sale` or `Sold`)
* **Square-foot pricing values displayed across the site**

This means the public website should not hardcode these items directly in page files. Instead, those pages should pull from managed backend data.

---

## Portal Features

### 1. Project / Completed Home Management

Admins should be able to create and manage completed home entries that appear on the public **Projects** page or catalog.

Each home entry should support:

* Project title / home name
* Build type or category
* Main cover image
* Multiple gallery images
* Basic specs

  * square footage
  * bed / bath count
  * location
  * finish level
  * short description
* Status

  * `For Sale`
  * `Sold`
* Optional featured toggle

When a new completed home is added in the portal, it should automatically become available for display on the Projects page.

### 2. Listing Status Control

Each completed home should have a simple status field.

Statuses:

* `For Sale`
* `Sold`

This status should be visible on both:

* the Projects / Catalog page card
* the individual project detail page

This allows the website to function partly as a portfolio and partly as an active inventory showcase.

### 3. Global Square-Foot Pricing Management

The portal must allow admins to edit square-foot pricing values used across the site.

This is important because pricing may appear in more than one place, such as:

* pricing page
* finish-level pages
* callout sections
* comparison modules
* estimate language on other pages

These values should be managed centrally in one settings area so the team can update pricing once and have it reflected everywhere.

Recommended structure:

* Builder Grade price per sq ft
* Builder+ price per sq ft
* Custom price per sq ft
* Optional note or disclaimer field

The site should reference these shared values dynamically rather than repeating static text in multiple files.

---

## UX Direction for the Portal

The backend portal should be intentionally simple.

Requirements:

* functional over visual
* clean forms
* fast data entry
* easy image upload
* easy editing of existing entries
* clear status labels
* no unnecessary dashboard complexity

This is an internal tool, not a branded public experience.

Use a minimal interface with:

* table or list view for homes
* edit form for each home
* basic settings page for pricing
* image upload support
* small-radius rounded corners only

### UI Note

All rounded corners in the portal should use a **very small radius** to keep the interface crisp and professional.

Suggested styling direction:

* avoid pill-shaped or heavily rounded cards
* use subtle corner radii only
* keep spacing practical and dense enough for admin use

---

## Recommended Content Model

### Project

* id
* slug
* title
* status
* category
* finish_level
* square_footage
* bedrooms
* bathrooms
* location
* short_description
* full_description
* cover_image
* gallery_images
* featured
* created_at
* updated_at

### Pricing Settings

* builder_grade_price_per_sqft
* builder_plus_price_per_sqft
* custom_price_per_sqft
* pricing_note
* updated_at

---

## Public Site Integration Notes

The public website should consume backend-managed data in the following way:

### Projects Page

Displays all completed homes from the backend.

Should support:

* cover image
* title
* short specs
* status badge (`For Sale` / `Sold`)
* link to individual detail page

### Project Detail Page

Each project should have a detail page generated from backend data.

Should display:

* image gallery
* specs
* finish level
* description
* status

### Pricing Page

Pricing blocks should read square-foot pricing from the backend settings instead of static page copy.

This ensures pricing can be changed once in the portal and reflected site-wide.

---

## Recommended Implementation Direction

For site architecture, the cleanest setup is:

* public frontend website
* separate protected admin portal
* shared database or CMS-backed data layer

The admin portal does not need to be elaborate. It only needs secure login, structured data entry, image upload, and settings control.

A practical model would be:

* frontend reads published project and pricing data
* admin portal creates and edits that data
* status and pricing changes appear on the live site automatically after save/publish

---

## What Codex Should Build

Codex should treat this as a lightweight internal operations system with two main management areas:

### A. Projects Manager

Used to:

* add completed homes
* upload home photos
* edit specs
* set `For Sale` or `Sold`
* manage project visibility on the Projects page

### B. Pricing Manager

Used to:

* edit square-foot pricing for each finish tier
* update pricing notes/disclaimers
* push those values to all public pricing references site-wide

---

## Final Intent

This portal is not meant to be a full business ERP or CRM.
It is only meant to give Howeth & Harp direct control over the website’s most important changing content:

* completed homes
* property status
* visual project catalog entries
* square-foot pricing

It should be fast, dependable, easy to maintain, and built with a restrained, minimal admin UI.
