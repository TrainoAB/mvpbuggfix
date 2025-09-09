<?php
function getEmailTemplate($header, $username, $content) {
    return '
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Template</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: white;
        color: black;
        padding: 20px;
        text-align: center;
      }
      .header img {
        max-width: 220px;
        height: auto;
      }
      .content {
        padding: 20px;
      }
      .footer {
        background-color: #f1f1f1;
        text-align: center;
        padding: 10px;
        font-size: 14px;
        color: #555555;
      }
      .footer a {
        margin: 0 10px;
        color: #8468ea;
        text-decoration: none;
      }
      .footer a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://traino.nu/app/assets/logo.jpg" alt="TRAINO" />
        <h1>' . $header . '</h1>
      </div>
      <div class="content">
        <p>Hej ' . $username . ',</p>
        ' . $content . '
        <p><strong>Med vänliga hälsningar</strong>,<br />TRAINO Team</p>
      </div>
      <div class="footer">
        <p>Följ oss på:</p>
        <a href="https://www.tiktok.com/@trainotheapp?_t=8mv1xt9tENU&_r=1"
          >TikTok</a
        >
        |
        <a href="https://www.instagram.com/trainotheapp?igsh=c3ljenRzbGNlajRv"
          >Instagram</a
        >
        <p>&copy; 2024 Traino. Alla rättigheter reserverade.</p>
      </div>
    </div>
  </body>
</html>
'; } ?>