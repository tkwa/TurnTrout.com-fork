---
permalink: avoiding-side-effects-in-complex-environments
lw-was-draft-post: "false"
lw-is-af: "true"
lw-is-debate: "false"
lw-page-url: https://www.lesswrong.com/posts/5kurn5W62C5CpSWq6/avoiding-side-effects-in-complex-environments
lw-linkpost-url: https://avoiding-side-effects.github.io/
lw-is-question: "false"
lw-posted-at: 2020-12-12T00:34:54.126Z
lw-last-modification: 2021-01-05T02:14:49.839Z
lw-curation-date: None
lw-frontpage-date: 2020-12-12T02:52:50.789Z
lw-was-unlisted: "false"
lw-is-shortform: "false"
lw-num-comments-on-upload: 12
lw-base-score: 62
lw-vote-count: 21
af-base-score: 26
af-num-comments-on-upload: 8
publish: true
title: "Avoiding Side Effects in Complex Environments"
lw-latest-edit: 2020-12-12T00:43:10.508Z
lw-is-linkpost: "true"
authors: Alex Turner and Neale Ratzlaff
tags: 
  - "impact-regularization"
  - "AI"
aliases: 
  - "avoiding-side-effects-in-complex-environments"
lw-reward-post-warning: "false"
use-full-width-images: "false"
date_published: 12/12/2020
original_url: https://www.lesswrong.com/posts/5kurn5W62C5CpSWq6/avoiding-side-effects-in-complex-environments
---
Previously: [_Attainable Utility Preservation: Empirical Results_](/attainable-utility-preservation-empirical-results)_; summarized in_ [_AN #105_](https://www.lesswrong.com/posts/gWRJDwqHnmJhurXgo/an-105-the-economic-trajectory-of-humanity-and-what-we-might#PREVENTING_BAD_BEHAVIOR_)

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/2526ca684eae62e8d1fc595b335044d649df02f30f2331b2.png)

Our most recent AUP paper was accepted to NeurIPS 2020 as a spotlight presentation:

> Reward function specification can be difficult, even in simple environments. Rewarding the agent for making a widget may be easy, but penalizing the multitude of possible negative side effects is hard. [In toy environments](https://arxiv.org/abs/1902.09725), Attainable Utility Preservation (AUP) avoided side effects by penalizing shifts in the ability to achieve randomly generated goals. We scale this approach to large, randomly generated environments based on Conway’s Game of Life. By preserving optimal value for a single randomly generated reward function, AUP incurs modest overhead while leading the agent to complete the specified task and avoid side effects.

Here are some slides from our spotlight talk ([publicly available](https://nips.cc/virtual/2020/public/session_oral_21090.html?fbclid=IwAR2tlTJHC7pZoFDDgCBoPNeUDpepXuFA-DrEH-zrDGOVjTB7hJzfCbIy5Gg); it starts at 2:38:09):

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/5d8db03fe692d0a310f42ec0c249a6b2be892ea6e84ec762.png)
<br/>Figure: Agents only care about the parts of the environment relevant to their specified reward function.![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/11973d84ffe3b4c8b56ebfe90261e336e126ad93cdda39a5.png)
<br/>Figure: We _somehow_ want an agent which is "conservative" and "doesn't make much of a mess."![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/fc33883d8d8accf1d88b5281873b491a4656bf87bd738cc7.png)![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/19247989a8c519fbc27fc9d100129444d4ca2f86968a9a8b.png)![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/27b61d7c2b20d763836e0f4205fc5cb0b043d8c999d9513b.png)
<br/>Figure: Before now, side effect avoidance was only demonstrated in tiny tabular domains.![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/2b563e34fa6fa1f80fcf5992515e3911668f03e0297e547b.png)
<br/>Figure: Conway's _Game of Life_ has simple, local dynamics which add up to complex long-term consequences.![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/bc36232e143377cc3fb23ec0eaf31d162c17fa41698f8356.png)
<br/>Figure: _SafeLife_ turns the _Game of Life_ into an actual game, adding an agent and many unique cell types.![](https://avoiding-side-effects.github.io/assets/img/explanation.png)
<br/>Figure: Crucially, there are fragile green cell patterns which most policies plow through and irreversibly shatter. We want the low-impact agent to avoid them whenever possible, _without_ telling it what in particular it shouldn't do. This is where the AUP magic comes in.![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/ec7027afd67e6d8d0d76cdf6f6f0ce4f1ca66561460c376e.png)
<br/>Figure: We learn the AUP policy in 3 steps. Step one: the agent learns to encode its observations (the game screen) with just one real number. This lets us learn an auxiliary environmental goal unsupervised.![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/8e06d19568bf8cf2aa3f1ae7cb68237f739e7e8526d16e69.png)
<br/>Figure: Step two: we train the agent to optimize this encoder-reward function "goal"; in particular, the network learns to predict the values of different actions.![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/ceedff3b01f8e4dd70c483030f9855e623643aa85c40b226.png)
<br/>Figure: Step three: we're done! We have the AUP reward function. Now we just learn to optimize it.

The full paper is [here](https://arxiv.org/pdf/2006.06547.pdf). Our [Github.io page](https://avoiding-side-effects.github.io) summarizes our results, with a side-by-side comparison of AUP to the baseline for randomly selected levels from the training distribution. The videos show you exactly what's happening, which is why I'm not explaining it here. 

# Open Questions

- In _Box _AI safety gridworld, AUP required >5 randomly generated auxiliary reward functions in order to consistently avoid the side effect. It only required one here in order to do well. Why?
- We ran four different sets of randomly generated levels, and ran three model seeds on each. There was a lot of variance across the sets of levels. How often does AUP do relatively worse due to the level generation?

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/a2648ed5ddce10481462919b3c0008d232082e2eebcea498.png)
<br/>Figure: _Figure 11 in the paper_: smoothed episode length curves for each set of randomly generated levels. Lower is better.
- Why did we only need one latent space dimension for the auxiliary reward function to make sense? Figure 4 suggests that increasing the dimension actually _worsened _side effect score.
  - Wouldn't more features make the auxiliary reward function easier to learn, which makes the AUP penalty function more sensible?

- Compared to the other conditions, AUP did far better on _append-spawn _than on the seemingly easier _prune-still-easy_. Why?

# Conclusion

I thought AUP would scale up successfully, but I thought it would take more engineering than it did. There's a lot we still don't understand about these results and [I continue to be somewhat pessimistic about directly impact regularizing AGIs](/excitement-about-impact-measures). That said, I'm excited that we were able to convincingly demonstrate that AUP scales up to high-dimensional environments; some had thought that the method would become impractical. If AUP continues to scale without significant performance overhead, that might significantly help us avoid side effects in real-world applications.

From the paper:

> To realize the full potential of RL, we need more than algorithms which train policies – we need to be able to train policies which actually do what we want. Fundamentally, we face a frame problem: we often know what we want the agent to do, but we cannot list everything we want the agent not to do. AUP scales to challenging domains, incurs modest overhead, and induces competitive performance on the original task while significantly reducing side effects – without explicit information about what side effects to avoid.