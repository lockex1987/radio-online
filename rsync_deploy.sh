rsync -avz --delete \
  --exclude .git/ \
  --exclude .gitignore \
  --exclude readme.md \
  --exclude rsync_deploy.sh \
  ./ lockex1987@103.142.26.170:/var/www/html/static/radio-online