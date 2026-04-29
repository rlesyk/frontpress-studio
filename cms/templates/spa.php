<?php
/** @var string $cmsRoot */
$srcRoot       = dirname(__DIR__, 2) . '/src';
$publicCmsRoot = dirname(__DIR__, 2) . '/public/cms';
$vite          = new MD\Vite($srcRoot, $publicCmsRoot);
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MD Admin</title>
<?= $vite->tags('main.jsx') ?>
</head>
<body>
<div id="root"></div>
</body>
</html>
