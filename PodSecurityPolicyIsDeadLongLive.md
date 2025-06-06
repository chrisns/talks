---
title: Pod Security Policy is Dead, Long Live...?
description: What are Pod Security Policies? What do you mean, they are deprecated? What am I going to do?!
author: Chris Nesbitt-Smith
marp: true
theme: themes/esynergy
class: lead
video_embed: <iframe width="560" height="315" src="https://www.youtube.com/embed/AciaVw_R1f4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
---

<!-- _class: title-page-->

<div>
<svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
<defs>
<path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
</defs>
<g class="parallax">
<use xlink:href="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.7" />
<use xlink:href="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" />
<use xlink:href="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.3)" />
<use xlink:href="#gentle-wave" x="48" y="7" fill="#fff" />
</g>
</svg>
</div>

<div class="scanlines"></div>

# PodSecurityPolicy is Dead,<br/>Long Live...?

<div class="glitch emoji" data-text="🤔">🤔</div>

## Chris Nesbitt-Smith

### UK Gov | Control Plane | LearnK8s | lots of open source

---

# 👋<!--fit-->

<!--
Hello! Imagine a thing with human faces, what a treat, I get to stand not worry about being on mute, use my clicker and everything!

My name is Chris, and I've been trying, with some success to use Kubernetes since 0.4 and I've got opinions on it, so strap in.

I'm Solution Architect at Appvia, instructor at LearnK8s, and tinkerer of open source including maintaining some high profile projects in the home automation space.

I'm often talk too fast when doing these, please shout at me when this happens, and jump in with questions though there will also hopefully be time at the end.

--- ONLINE ---
Hello! Thank you so much for joining me here today.

So, to kick things off my name is Chris Nesbitt-Smith, I'm based in London and currently work with some well known brands like learnk8s, control plane, esynergy and various bits of UK Government I'm also a tinkerer of open source stuff.

I've been using and abusing Kubernetes in production since it was 0.4, believe me when I say its been a journey!

I've definitely got the scars to show for it.

It'd be great to hear where you're joining from today so if you could drop a comment in the chat and let me know where you are that'd be great.

We'll have time for any questions at the end if you want to drop them into the comments.

-->

---

# `kubectl get pods` <!--fit-->

<!--
By show of hands who's worked with pods before?

--- ONLINE ---

In a virtual, bit offline, by show of hands (or dropping off the stream) who's worked with pods before?
-->

---

# 🙋👩‍🌾👩‍🚒</br>🙋‍♀️🦹‍♀️🙋‍♂️<!--fit-->

---

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.14.2
      ports:
        - containerPort: 80
```

<!--
Cool, and for anyone that didn't raise their hand, welcome to the party you almost missed it!

Pods are the smallest deployable units of computing that you can create and manage in Kubernetes, they represent a single instance of a containerized application running in your cluster.
-->

---

# PodSecurityWhat?<!--fit-->

# 🤔 <!--fit-->

<!--
Ok so now for the topic of this talk, pod security policies
-->

---

```yaml
kind: PodSecurityPolicy
```

<!--
They've been around since 1.0, which is about a million Kubernetes years.
-->

---

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
```

<!--
and in that time has never made it past the beta classification, and I believe may be last v1beta1 resource that is routinely used in production, that is after ingress left beta not long ago.
-->

---

# 😢 <!--fit-->

<!--
Sadly that's not the case for PSPs, they were deprecated in 1.21, and was removed entirely in 1.25.
-->

---

<!-- _class: invert -->

# `kubectl explain PodSecurityPolicy`

Pod Security Policies enable fine-grained authorization of pod creation and updates.

A Pod Security Policy is a cluster-level resource that controls security sensitive aspects of the pod specification. The PodSecurityPolicy objects define a set of conditions that a pod must run with in order to be accepted into the system, as well as defaults for the related fields.

https://kubernetes.io/docs/concepts/policy/pod-security-policy/

<!--
What is a PSP apart from more words than should ever be on a slide?
-->

---

<!-- _class:  invert fade -->

# `kubectl explain PodSecurityPolicy`

Pod Security Policies enable **fine-grained authorization** of **pod** **creation** and **updates**.

A Pod Security Policy is a **cluster-level** resource that controls security sensitive aspects of the pod specification. The PodSecurityPolicy objects define a set of conditions that a pod must run with in order to be accepted into the system, as well as defaults for the related fields.

<!--
Thats better
PSPs give cluster admins an ability to impose limits over things like running as root, opening ports on the host, types of volume you can use etc
-->

---

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: example
spec:
  privileged: false
  seLinux:
    rule: RunAsAny
  supplementalGroups:
    rule: RunAsAny
  runAsUser:
    rule: RunAsAny
  fsGroup:
    rule: RunAsAny
  volumes:
    - "*"
```

<!--
If you've not seen one before it looks something like this [pause]
-->

---

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: demo
spec:
  containers:
    - name: demo
      image: alpine
      securityContext:
        privileged: true
```

<!--
Who can give me an example of what this container can actually do, say if a remote code exploit is found, or your code is bad?

--- ONLINE ---
Looking at this pod, can anyone give me an example of what this container can actually do, say if a remote code exploit is found, or your code is bad?
If you can get ahead of me and leave a comment in the comments.

-->

---

<!-- _class: lead invert -->

![bg](./images/bg.svg)

# Live demo

<!--

Lets have a quick explore and find out:

set +o history
kind create cluster --image=kindest/node:v1.23.0

kubectl run --image debian -ti unpriv

kubectl run --rm --privileged --image debian -ti priv

  ls /dev

  mkdir /foo && mount /dev/vda1 /foo
  export PATH=$PATH:$(find /foo/ -type f -name kubectl | head -n 1 | sed -r 's|/[^/]+$||')
  ln -s $(find /foo -type l -name kubelet-client-current.pem  | sed -r 's|/[^/]+$||'| sed -r 's|/[^/]+$||') /var/lib/
  export KUBECONFIG=$(find /foo/ -type f -name kubelet.conf -print -quit)
  kubectl get pods -A
  kubectl get nodes


---

 - repartition disks
 - eBPF interception of kernel wide activity including network intercept
 - mount the root or any other file system which is a bad day, you've then got root on the node complete with the kubelet, which with a couple of get requests to the api server gives you admin and service account credentials on the api server.
 - Put simply, game over, real fast, everything on your cluster and everything your cluster connects to is at breach.
-->

---

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: demo
spec:
  containers:
    - name: demo
      image: alpine
    volumeMounts:
    - mountPath: /storage
      name: storage
  volumes:
  - name: storage
    hostPath:
      path: /
      type: Directory
```

<!--
Ok bit more obvious, again game over under the same terms as before
-->

---

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: demo
spec:
  hostNetwork: true
  containers:
    - name: demo
      image: alpine
```

<!--
How about this, can anyone help me out?

 - masquerade as other things to the network, maybe get 443 or 80 and get traffic that was intended for cluster wide ingress
 - talk to and masquerade with all sorts of local systems to the host, like X, dbus, iscsi, the container runtimes

Bit more involved but game over after you've jumped through a few hoops to get root
-->

---

![bg](./images/etc.jpeg)

<!--
Basically leave any one of the controls in the PSP open and you can be one bad pod away from loosing absolutely everything.
-->

---

# 👍 <!--fit-->

<!--
So PSPs sound like a great idea right?
-->

---

# ✋ <!--fit-->

<!--
Not so fast bucko!
Theres a whole heap of usability issues you might have encountered if you'd tried to use them in anger.
-->

---

![bg](./images/binding.jpeg)

<!--
The policy is based on the user that created the pod, not the workload.
If you're creating pods with CI for example that might require you to have multiple identities to authenticate to the API server with
But when was the last time you created a pod and not a deployment, statefulset or whatever else, well in that case the identity creating the pod is the service account for that controller
-->

---

![bg](./images/mutating.jpeg)

<!--
Some of the parameters aren't simply admission controllers that accept or reject but mutating, this is not clear
-->

---

![bg](./images/outoforder.jpeg)

<!--
The of order of evaluation can be confusing and unpredictable with multiple policies with overlapping scope especially if some are mutating
-->

---

# 🏃‍♀️ <!--fit-->

<!--
Only applies to new pods, not to anything already running in the cluster, which means you might not know when you update the policy that it breaks your production apps, that is until they happen to try to reschedule and fail, maybe on a scale event or node fail.
-->

---

# So now what? <!--fit-->

<!--
So what are the alternatives, what should we do, the clock is ticking, august is only another lockdown or two away!
-->

---

<!-- _class: listline animate lead  -->
<style scoped>
li {
  font-size: 2em;
}
</style>

- Admission Control
- Anchore
- Azure Policy
- Istio
- jspolicy
- K-rail
- Kopf
- Kubewarden
- Kyverno
- OPA Gatekeeper
- Opslevel
- Polaris
- Prisma Cloud
- Qualys
- Regula
- Sysdig
- TiDB

<!--
Theres a fair amount of choice, here's just a few, you can of course write your own, it is just a webhook.
-->

---

<!-- _class: fade listline lead  -->
<style scoped>
li {
  font-size: 2em;
}
</style>

- Admission Control
- Anchore
- Azure Policy
- Istio
- jspolicy
- K-rail
- Kopf
- **Kubewarden**
- **Kyverno**
- **OPA Gatekeeper**
- Opslevel
- Polaris
- Prisma Cloud
- Qualys
- Regula
- Sysdig
- TiDB

<!--
I'm going to focus on a few, because with a little help they provide a straight forward-ish migration journey
-->

---

# Wait, what about </br>Pod Security Standards </br>&</br> Pod Security Admission?

<!--
There is an 'in tree' answer i.e. built in to Kubernetes, so why am I not pointing at that, grabbing my drink and walk off?
Pod Security Standards are most easily thought of as three rigidly defined predefined Pod Security Policies
-->

---

<!-- _class:  invert lead -->

# Privileged <!--fit-->

<!--
Those are privileged, basically anything goes, and is the same as not defining a policy
-->

---

<!-- _class:  invert lead -->

# Baseline<!--fit-->

<!--
Baseline, middle ground, stops some of the super obvious stuff, most your stuff should run at this tier without change
-->

---

<!-- _class:  invert lead -->

# Restricted<!--fit-->

<!--
Restricted, The most restrictive policy, stops most things.
You should aspire to run stuff here, but realistically you'll probably have issues
-->

---

<!-- _class:  invert lead -->

# 😀 <!--fit-->

<!--
Rigid universal policies sounds great, its super easy to communicate these between teams, test against them and no confusion when deploying between different clusters, happy days right?
-->

---

<!-- _class:  invert lead -->

# ☹️ <!--fit-->

<!--
Sadly not, for a few reasons
Ideally you'd run all your workload at restricted, but inevitably there'll be some things that can't quite fit that
Well restrictions are applied on a namespace level
And theres no way to grant fine grained exemptions, so your only option is to take a massive step down, and not for just the container but whole namespace
-->

---

<!-- _class:  invert lead -->

# 😱 <!--fit-->

<!--
Oh, and its applied with a label on the namespace, not even an annotation
WTF guys?!
So what's it good for, well the only thing I can see this as possibly good for is if you're a Software Vendor building products to run on Kubernetes.
-->

---

<!-- _class:  invert lead -->

# 😜 <!--fit-->

<!--
And if you're mad enough to be in that business
-->

---

<!-- _class:  invert lead -->

# 🌟 <!--fit-->

<!--
Then if you can make your product run in restricted then it'll give you a good head start for whatever unique configuration your customers have implemented and demonstrate that you have considered the security implications of your product
-->

---

# 🧓👴 <!--fit-->

<!--
Ok so how do we migrate all our old legacy PSPs to something new
Well there is unfortunately no simple like-for-like mapping, PodSecurityPolicy and any of the replacements behave slightly differently, and for good reason too.

If you’ve been using PodSecurityPolicy for a while, you’ve likely developed some quite complex rules which have become entangled with the usability issues, so I would encourage you to take the opportunity to refactor and simplify over trying to continue what you’ve always done.

That said, there has been some work to ease the transition by reproducing the key capabilities and even calling them the same things in some cases.
-->

---

# 🥁 <!--fit-->

<!--
The short answer is...
-->

---

![bg](./images/psp-chris.jpeg)

<!--
use a whizz-bang-super-duper tool that I made
-->

---

![bg fit](./images/psp-terminal.webp)

<!--
Simply provide your existing PSP and take your pick of policy engine from Kyverno, Kubewarden, or Gatekeeper.
-->

---

![bg fit](./images/psp-web.webp)

<!--
Or just paste it into our simple web app and let your browser do the work
-->

---

<!-- _class:  invert lead -->
<style scoped>
h1 {
  bottom: 0;
  position: absolute;
  font-size: 4em;
  -webkit-text-stroke-width: 3px;
  -webkit-text-stroke-color: black;
}
</style>

# Live demo

![bg](./images/psp-chris.jpeg)

<!--
Live demo time!
-->

---

<!-- _class:  invert lead -->

# PodSecurityPolicy

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: example
spec:
  privileged: false
  seLinux:
    rule: RunAsAny
  supplementalGroups:
    rule: RunAsAny
  runAsUser:
    rule: RunAsAny
  fsGroup:
    rule: RunAsAny
  volumes:
    - "*"
```

<!--
Your PSP just converted seamlessly to
-->

---

<!-- _class:  invert lead -->

# Kyverno

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: example
spec:
  rules:
    - validate:
        pattern:
          spec:
            "=(initContainers)":
              - "=(securityContext)":
                  "=(privileged)": false
            "=(ephemeralContainers)":
              - "=(securityContext)":
                  "=(privileged)": false
            containers:
              - "=(securityContext)":
                  "=(privileged)": false
        message: Rejected by psp-privileged-0 rule
      match:
        resources:
          kinds:
            - Pod
      name: psp-privileged-0
```

<!--
Kyverno . .
-->

---

<!-- _class:  invert lead -->

# Kubewarden

```yaml
apiVersion: policies.kubewarden.io/v1alpha2
kind: ClusterAdmissionPolicy
metadata:
  name: example
spec:
  module: registry://ghcr.io/kubewarden/policies/pod-privileged:v0.1.9
  rules:
    - apiGroups:
        - ""
      apiVersions:
        - v1
      resources:
        - pods
      operations:
        - CREATE
        - UPDATE
  mutating: false
  settings: null
```

<!--
Kubewarden . .
-->

---

<!-- _class:  invert lead -->

# OPA Gatekeeper

```yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPPrivilegedContainer
metadata:
  name: example
spec:
  match:
    kinds:
      - apiGroups:
          - ""
        kinds:
          - Pod
  parameters: null
```

<!--
or Gatekeeper . .
-->

---

![bg fit](./images/easy.webp)

<!--
That was easy
-->

---

# But, should you migrate from PodSecurityPolicy?

<!--
But should you?
Don't be fooled, just because I wrote a tool to help does not mean I think any of this is even remotely a good idea for the vast majority of use cases.

But it got your attention.
-->

---

# 🚫 <!--fit-->

<!--
Using a cluster enforced policy does not guaranty any real security, you may well find as a cure, its worse than the disease.
-->

---

![bg](./images/pwnkit.png)

<!--
We're seeing more and more vulnerabilities and in the wild attacks that cluster enforced policy would not protect against.
-->

---

# sorry <!--fit-->

## (not sorry)

<!--
If you've been keeping up you'll have realized I've taken you on a roller coaster of explaining a problem with security in Kubernetes, a solution of PSP, another problem of PSPs going away, another solution of a tool that I've built and yet another problem that undermines everything I've just told you.
-->

---

![bg fit](./images/GoodNews.jpeg)

<!--
The good news is there are answers, they are simple but not easy
-->

---

![bg](./images/baiting.jpeg)

<!--
but I'm out of time, so you'll have to come back and find out in my next talk
-->

---

![bg fit](./images/spoiler-alert.jpeg)

<!--
As a sign of good faith though
-->

---

<!-- _class: listline lead animate -->

<style scoped>
li {
  font-size: 1.6em;
}
</style>

- AppArmor
- Continuous Integration
- Cultural Change
- eBPF
- GitOps
- Keep it Stupid Simple
- Kernel Level Protection
- Policy as code
- seccomp
- Secure By Design
- Security Profiles Operator
- SELinux
- Shared Responsibility Model
- Shift Left
- Testing
- Version Controlled Policy
- Zero trust

<!--
You can expect a scenic walk through buzzwords like these and I'm excited to be able to share some hard but simple solutions that can provide a robust level of coverage and also advice on how to tackle the cultural change that needs to go hand in hand with the tech.
-->

---

<!-- _class: invert -->
<style scoped>
h2 {
  position: absolute;
  bottom: 1ch;
  left: 2vw;
  width: 95%
}
</style>

# 🙏 Thanks 🙏 <!--fit-->

![bg right](./images/theend.gif)

- cns.me
- github.com/chrisns
- github.com/appvia
- appvia.io/blog

## Chris Nesbitt-Smith <!--fit-->

<!--
Thanks for your time, hopefully this has been interesting if a tease.

Please do follow me on LinkedIn, Twitter, Github and you can be assured there'll be no spam since I'm awful at self promotion especially on social media. cns.me just points at my linkedin

The original content for this talk and some of the solutions I've alluded to including how to do Policy as Versioned Code are on the appvia.io blog.

Questions are very welcome on this or anything else, If I miss you or you're not watching this live I'll try and keep an eye on the comments, or find me on the DevSecCon discord or LinkedIn.
-->
