<?php 
require_once('db.php');
require_once('functions.php');


  $email = 'fredrik@diam.se';
  $encodedEmail = urlencode($email);
  $confirmLink = "https://traino.nu/confirm-email/" . $encodedEmail . "/test";
  $to =  $email ;
  $subject = "TRAINO - Verifiera din e-postadress";
  $message = "Hej,<br><br>Tack för att du registrerat dig som tränare på Traino. Nu behöver du bara klicka på länken nedan för att bekräfta din e-postadress, sedan kan du logga in:<br><br><a href=" . $confirmLink . " target='_blank'>"  . $confirmLink . "</a><br><br>MVH<br>Traino";
  
  $pdo = null;
  

  if(sendEmail($to, $subject, $message, $headers = [])) {
    echo "Email sent successfully to $to";
  } else {
    echo "Failed to send email to $to";
  }
?>