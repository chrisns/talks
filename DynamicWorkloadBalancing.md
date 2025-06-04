---
title: Dynamic Workload Balancing and Resource Optimization in Kubernetes
description: In this talk, Chris will explore the challenges and benefits of dynamically balancing and optimizing the resources of a Kubernetes cluster. He will explain how Kubernetes uses a scheduler to assign pods to nodes based on various factors, such as resource requests, limits, affinity, anti-affinity, and taints. He will also demonstrate how to use tools and techniques, such as horizontal pod autoscaling, cluster autoscaling and the descheduler, to improve the performance and efficiency of your cluster. From this talk, you will learn how to leverage the power and flexibility of Kubernetes to achieve optimal resource utilization and workload distribution.
author: Chris Nesbitt-Smith
video_embed: <iframe width="560" height="315" src="https://www.youtube.com/embed/WQP6xuUJAhE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
image: https://talks.cns.me/images/DynamicWorkloadBalancing/1-2.svg
marp: true
url: https://talks.cns.me/DynamicWorkloadBalancing.html
class: lead
---

![bg contain](images/DynamicWorkloadBalancing/1-4612.svg)

<!--
Hi
-->

---

![bg contain](images/DynamicWorkloadBalancing/33-253.svg)

<!--
So, to kick things off my name is Chris Nesbitt-Smith, I'm based in London and currently work with some well known brands like learnk8s, control plane, and various bits of UK Government I'm also a tinkerer of open source stuff.

I've been using and abusing Kubernetes in production since it was 0.4, believe me when I say its been a journey!

I've definitely got the war wounds to show for it.

We should have time for questions and heckles at the end, but if we run out of time or you're not watching this in realtime, then please find me on LinkedIn or in the linode slack
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3076.svg)

<!--
Kubernetes embraces the idea of treating your servers as a single unit and abstracts away how individual computer resources operate.
From a collection of three servers, Kubernetes makes a single cluster that behaves like one.

-->

---

![bg contain](images/DynamicWorkloadBalancing/1-2996.svg)

<!--
1/4
So if we Imagine having three servers.



-->

---

![bg contain](images/DynamicWorkloadBalancing/1-2885.svg)

<!--
2/4
You can use one of those servers to install the Kubernetes control plane.


-->

---

![bg contain](images/DynamicWorkloadBalancing/1-2772.svg)

<!--
3/4
The remaining servers can join the cluster as worker nodes.



-->

---

![bg contain](images/DynamicWorkloadBalancing/1-2746.svg)

<!--
4/4
Once the setup is completed, the servers are abstracted from you. You deal with Kubernetes as a single unit.



-->

---

![bg contain](images/DynamicWorkloadBalancing/1-2708.svg)

<!--
1/4
When you want to deploy a container, you submit your request to the cluster.
Kubernetes takes care of executing `docker run` and scheduling the container in the right server.



-->

---

![bg contain](images/DynamicWorkloadBalancing/1-2658.svg)

<!--
2/4
The same happens for all other containers.



-->

---

![bg contain](images/DynamicWorkloadBalancing/1-2595.svg)

<!--
3/4


-->

---

![bg contain](images/DynamicWorkloadBalancing/1-2443.svg)

<!--
4/4
For every deployment, Kubernetes finds the best place to run the application.



-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3323.svg)

<!--
Kubernetes can automatically scale your application for you
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3277.svg)

<!--
But you'll likely find you run out of compute resource

but all is not lost, Kubernetes has yet another trick up its sleeve
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3200.svg)

<!--
Given access to your underlying infrastructure when you run out
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3079.svg)

<!--
it can even dynamically provision additional compute when you require it using the Cluster autoscaler
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3406.svg)

<!--
If you didn't see Salman's fantastic talk on this a couple of weeks ago, I highly recommend watching that back for a really insightful walk through that
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3489.svg)

<!--
So far this is all sounding great, clusters can scale up and down both in workload and compute resource, and scheduling is all working perfectly
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3492.svg)

<!--
but you'll quickly find when your workload scales down, it might not happen how you would anticipate it to
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3623.svg)

<!--
which can lead you to undesirably loaded clusters, when what you'd really like is for things to rebalance
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-788.svg)

<!--
So If we look at a deployment spec
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-784.svg)

<!--
You'll notice there is no field or instruction for Kubernetes  on how you'd like your workload to be rebalanced.
Put simply once Kubernetes has scheduled the workload, it considers it's job done, thats the end, until something goes wrong.
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3756.svg)

<!--
This has been an issue that has played on many people's minds which has led to the desire for descheduling workload in order to let the scheduler readjust with new information
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-2.svg)

<!--
I might be showing my age now, but I remember a time when I used to have to defragment my hard disk
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3759.svg)

<!--
Hours staring at a screen that looks like this because the way the file system works is data is written anywhere, then when its later deleted leaves gaps
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3766.svg)

<!--
Not at all dissimilar to how the Kubernetes scheduler works
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-3915.svg)

<!--
When you delete workload you can find yourself with gaps, that if you were to reschedule everything from scratch wouldn't exist
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4256.svg)

<!--
The effect of descheduling then causes our old friend the Kubernetes scheduler
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4068.svg)

<!--
to notice that a pod has been deleted from an undesirable location
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4349.svg)

<!--
create a new pod
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4018.svg)

<!--
and then go through all the process
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4434.svg)

<!--
of filtering what nodes are available to run the workload with all sorts of complex rules
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4523.svg)

<!--
then scoring them through some more very complex rules
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-680.svg)

<!--
before deciding where best to place the workload
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4633.svg)

<!--
In order to do this the descheduler has policies you can define at a cluster level
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-662.svg)

<!--
these are split into two categories of balance and deschedule

where balance is intended to redistribute your workload across the nodes

the deschedule is intended to cause the workload to be evicted based on some rules such as the lifetime of a pod
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4681.svg)

<!--
And the configuration looks very familiar to other things in Kubernetes in that it closely resembles a CRD

though don't be fooled by this, its not actually a CRD,
you have to put this into a specifically named configmap as a text blob
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4692.svg)

<!--
So here we can define our plugin configurations in our profile
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4703.svg)

<!--
And elect which plugins should be enabled
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4713.svg)

<!--
and our categories we saw earlier are referred to as extension points
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4725.svg)

<!--
there are other extension points available, but we'll be focusing on the deschedule and balance ones today
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4775.svg)

<!--
A common use case might be, you've got applications that for whatever reason you want to restart, once an hour, or night because reasons
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-586.svg)

<!--
So an example of that configuration might look like this, where we will look to restart pods over 10 seconds old
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4778.svg)

<!--
this is the exciting part where i pray to the demo gods for the first time today....
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4781.svg)

<!--
There are a few options for how you can run the descheduler on your cluster
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4784.svg)

<!--
You could run it as a one off job, or perhaps you've got some other orchestration system that will create jobs on your cluster for you
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4802.svg)

<!--
Or a cronjob, resulting in periodic jobs being created as you desire
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4808.svg)

<!--
Or a deployment that will run all the time in a loop
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4814.svg)

<!--
To look at cronjob option
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4817.svg)

<!--
Here we can see a cronjob specification, that will execute every minute, depending on your size of cluster and shape of workload this may be undesirable, you may want more or less frequent
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4830.svg)

<!--
Because it runs as a cronjob the descheduler pod is created somewhere on your cluster, allocated dynamically, and of course uses resource of its own
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4849.svg)

<!--
which could end up influencing the schuedler when it comes round to rescheduling all the work it deletes
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4886.svg)

<!--
So having it disappear as soon as its descheduled the other workloads allows for the new rebalanced scheduling to happen without the presence of the deschedulers influence
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4827.svg)

<!--
Another approach is to run the descheduler in a deployment
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4917.svg)

<!--
It does support a highly available configuration where you can have multiple concurrent deschedulers running
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-4983.svg)

<!--
And they will periodically run to delete pods
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-5037.svg)

<!--
However only one descheduler is actually doing the work, they will elect a leader, and the other replicas will only become active if the current leader is unavailable
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-5095.svg)

<!--
So to look at another policy available to you, theres the duplicate policy
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-5108.svg)

<!--
if we consider a scenario like this
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-5140.svg)

<!--
if you were to loose the right hand node, your orange pods would suffer a 67% impact and your green pods would be entirely unavailable until the node outage were picked up some 5 minutes later
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-5098.svg)

<!--
which is what the remove duplicates balancer is intended for
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-5166.svg)

<!--
which should cause your workload to rebalance across your nodes and reduce your concentration of risk a single node
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-5191.svg)

<!--
demo gods..
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-5194.svg)

<!--
Metrics are a pretty big deal in Kubernetes as you are no doubt aware, while there are more advanced metrics capabilities available
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-5197.svg)

<!--
the descheduler uses some more primitive and consistently available ones

if we remember how the kubelet that exists on every node works
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-5521.svg)

<!--
The job of the kubelet is to keep the current node synchronized with the state of the control plane.
So it continuously polls the control plane for updates.
Remember when we said that the scheduler assigns pods to nodes?
If the kubelet finds a pod assigned to the current node, it will retrieve the spec for that pod.
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-5845.svg)

<!--
causing the docker image to be pulled down, given to container d and start running
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-6493.svg)

<!--
the kubelet then reports the ongoing health of the node and the pods to the kubelet, and it uses cAdvisor to gather local metrics on CPU, memory and disk concentration
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-6832.svg)

<!--
to send off to the Kubernetes api server where that is tracked

for the astute amongst you, cadvisor is due to be replaced in the next release of Kubernetes, but the principal will remain the same
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7163.svg)

<!--
using that data allows us to make some interesting decisions on how to deschedule our workloads to reach a more desirable balance
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7166.svg)

<!--
an example of that is the high node utilization plugin, which will work to schedule your workloads to maximise your bang for buck on compute nodes
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7176.svg)

<!--
so if you have a node looking like this
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7217.svg)

<!--
it will identify the under utilized node and deschedule the workload in order to allow your cluster auto scaler to remove the node
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7460.svg)

<!--
As a quick refresher
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7450.svg)

<!--
1/5
When you provision an EC2 instance, you might think that the memory and CPU available can be used for running Pods.
And you are right.



-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7434.svg)

<!--
2/5
However, some memory and CPU should be saved for the operating system.



-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7413.svg)

<!--
3/5
And you should also reserve memory and CPU for the kubelet.



-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7387.svg)

<!--
4/5
Is the rest made available to the pods?



-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7358.svg)

<!--
5/5
Not quite yet. You also need to reserve memory for the Eviction threshold.
If the kubelet notices that memory usage is going over that threshold, it will start evicting pods.



-->

---

![bg contain](images/DynamicWorkloadBalancing/14-11032.svg)

<!--
Daniele (or d5e to his friends)

Did a brilliant talk on this last month, and the considerations on how to right size your cluster, which if you didn't see, then please do seek that out
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7254.svg)

<!--
next up is the low utilisation policy
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7257.svg)

<!--
which provides a few more options to try and achieve a sweet spot of node
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7269.svg)

<!--
utilisation by providing an upper threshold and a lower threshold
in my scenario a node under 20% is considered under utilised
and over 70% is over utilised
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7314.svg)

<!--
which will cause the descheduler to rebalance accordingly to try and get the nodes into that sweet spot between
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7355.svg)

<!--
last demo gods
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7464.svg)

<!--
Related to a lot of this space is the node problem detector
there are loads of things that can go wrong on a node, but without this installed, Kubernetes will be totally unaware and continue to schedule workload on to an unhappy node until it is marked offline 5 minutes after it has totally failed
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-7766.svg)

<!--
which you can run as a daemonset in your cluster, meaning that it will run on every node
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-8418.svg)

<!--
and can detect things such as NTP being down or out of sync
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-8743.svg)

<!--
CPU, memory and disk issues
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-9068.svg)

<!--
kernel deadlocks, corrupted file systems
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-9393.svg)

<!--
issues with the container runtime
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-9718.svg)

<!--
or the kubelet
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10043.svg)

<!--
and report that to the Kubernetes controlplane
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10368.svg)

<!--
the node controller is the Kubernetes component that is ready to process that information
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10371.svg)

<!--
after it has arrived at the api server
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10437.svg)

<!--
the node controller lives in the controller manager
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10509.svg)

<!--
and can add taints such as unreachable to the node
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10826.svg)

<!--
combining this all
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-496.svg)

<!--
with the node problem detector deployed
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10829.svg)

<!--
if it detects that the node is unreachable
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10872.svg)

<!--
the node can be tainted
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10915.svg)

<!--
and the taints violation policy
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10918.svg)

<!--
could be configured to reschedule the workload on that node
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-444.svg)

<!--
causing the descheduler to evict all the pods
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-390.svg)

<!--
and allow the scheduler to rebalance the workload
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10933.svg)

<!--
preventing any pods being scheduled on the right hand node
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-10987.svg)

<!--
in combination with the cluster autosscaler
-->

---

![bg contain](images/DynamicWorkloadBalancing/1-345.svg)

<!--
it can notice that the utilization is low and trigger the downscaling of that node
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-11132.svg)

<!--
That was a long journey!

So some key takeaways
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-11125.svg)

<!--
Vanilla Kubernetes will not rebalance or defrag your nodes and pods
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-11153.svg)

<!--
The descheduler exists as an add on that will take on this task
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-11161.svg)

<!--
it is configured by policies that dictate its behaviour and will drive your cluster to a more desirable configuration
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-11169.svg)

<!--
and it will take low level metrics from the nodes and pods in order to inform this rather than using metrics-server or similar
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-11177.svg)

<!--
And the node problem detector can be used to provide early reactions to nodes becoming unhealthy and direct your workload to run elsewhere
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-11119.svg)

<!--
Thank you very much for your time
I've been Chris Nesbitt-Smith
find me on linked in, and do be sure to check out the other webinars we've done with linode

Like, subscribe and whatever the kids do these days
-->

---

![bg contain](images/DynamicWorkloadBalancing/33-276.svg)

<!--
I'll now open the floor to any questions, if we don't get to you or you're not watching this in realtime, then please do join the slack community
-->

---

![bg contain](images/DynamicWorkloadBalancing/14-11257.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-11245.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-11231.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-11225.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-11222.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-11190.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-11187.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-11185.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-19051.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-19043.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-19025.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-19003.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-18992.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-18949.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-18927.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-18841.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-18689.svg)

---

![bg contain](images/DynamicWorkloadBalancing/14-18188.svg)

---
