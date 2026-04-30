<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Setup required — MD Framework</title>
<link rel="stylesheet" href="/cms/admin.css">
</head>
<body class="login-page">
<div class="login-card">
  <h1>Setup required</h1>
  <div class="login-error">
    No admin credentials are configured.
  </div>
  <p>Create <code><?= e($envFile) ?></code> with:</p>
  <pre><code>ADMIN_USER=admin
ADMIN_PASS_HASH=</code></pre>
  <p>Generate a bcrypt hash for the password:</p>
  <pre><code>php -r "echo password_hash('yourpassword', PASSWORD_BCRYPT);"</code></pre>
  <p>Paste the output as the value of <code>ADMIN_PASS_HASH</code>.</p>
  <p>Full instructions: <a href="https://krstivoja.github.io/mdframework/admin/" target="_blank" rel="noopener">Admin docs</a>.</p>
</div>
</body>
</html>
