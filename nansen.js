const test = async () => {
  const response = await fetch(
    "https://app.nansen.ai/api/questions/wp-related-wallets",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        authorization:
          "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg1NzA4MWNhOWNiYjM3YzIzNDk4ZGQzOTQzYmYzNzFhMDU4ODNkMjgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZDUtbmFuc2VuLXByb2QiLCJhdWQiOiJkNS1uYW5zZW4tcHJvZCIsImF1dGhfdGltZSI6MTc0NTEyMzc5MywidXNlcl9pZCI6IjhSdzlqZzlWNTJVQnRDMGJueFZrTU1MUVBXSTMiLCJzdWIiOiI4Unc5amc5VjUyVUJ0QzBibnhWa01NTFFQV0kzIiwiaWF0IjoxNzQ1MTIzNzkzLCJleHAiOjE3NDUxMjczOTMsImVtYWlsIjoiZGF2aWR2YW5pc2Fja2VyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImRhdmlkdmFuaXNhY2tlckBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.mhe2X40ZEPLvJMvkx-ZpLGcYtcYiZCoMtYY2tuUVPj4vf1GDbOAJaRFTlgqisu2gF8o53KwDFOYdsyuZeKV9_datZk7c2yPr6V43tPPaGVlHiYefFWcxDof7mFpC3EIWHOtF1KWlh2c8PZt3Nt4Clj27TSmUIu7mDpd5xBSVnBFq_mzdXfkt1RkxOzqkXbiTJYUrKH397DxwQSSY-SFpQqzcXEWpBQMLUMO1YcHayi9YgVumwKVC7-bdnnPnQrBo6EQuqelZnlo-HRX-PATYkuheQqOFVeriBySRJanfy3Y6e7nT9D5bQC_E5dbB2x5fxy3qdIFsF0borVs_M5Jvhg",
        baggage:
          "sentry-environment=production,sentry-release=ei9Drpup2yw5GZFTBfd8d,sentry-public_key=5681c82215b040b384c8ed93b7774f4c,sentry-trace_id=7385a135b1564dfa94940fa1ad77673a,sentry-sample_rate=0.01,sentry-transaction=%2Fprofiler,sentry-sampled=false",
        "cache-control": "no-cache",
        "content-type": "application/json",
        "dashboard-id": "profiler",
        "feature-name": "widget",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sentry-trace": "7385a135b1564dfa94940fa1ad77673a-a1edfe90f7c5c5b5-0",
        "tab-id": "overview",
        "widget-id": "wp-related-wallets",
        "x-build-info": "localhost",
        "x-nansen-uid": "8Rw9jg9V52UBtC0bnxVkMMLQPWI3",
        cookie:
          "_hjSessionUser_3654344=eyJpZCI6ImY3NzE1NDdlLTUzMGMtNTJiMi1hZTZmLWM4OGUzMjJlN2E4ZiIsImNyZWF0ZWQiOjE3NDUwMzMzNTQ3OTcsImV4aXN0aW5nIjp0cnVlfQ==; _hjSession_3654344=eyJpZCI6IjZjMzVkYzI3LTA3ZmQtNGNmYi05ZjIzLWU5YTkzNDhiMWI0YiIsImMiOjE3NDUxMjM3MzY4MTAsInMiOjEsInIiOjEsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MH0=; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2F4kuMuEH%2F6PU%2FVgp6fHVdZKIifMRS0cQsu3AjBI51Z%2FeI8ctrCWc0wClP%2Bs%2F5wqp3RwvB7PKC%2FdQ%3D%3D; rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX1%2Fs5icCdqUcJYWSW0BG%2FZwaYN56SYzQoYM%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1868OwE9vWubBpXrDX9RC3osTcIppSWfuM%3D; cf_clearance=fQf55yYtzYWueoXPJQEj9r8E1Yyits2vfImBsbPn0oI-1745123792-1.2.1.1-wgRSZiVcRX89cYDjDimEIf4AIN6xwXHunBwKMVSkNSLMbdIXiht0NDlAGdaVP0lYxuZgO3sbn1_TpVkFn7pv3XBH.EwZk8oVaOae5DBszrixoQ2cO8Slpdfg2T.mCoo32rNE4diCDQLgqQePPC5EYHYIN0fCKn_psts1zq.CTmF75UHTiXPzMXq9rj4pEmV2A7jtStyfDqb9CX_3i3AEmm_aT3A.Z_TKMnUOuhFjmyQZTceJYq.DzRxBS1B21635qsOxSgy6wdjtbSJr2bejLZHtbZVCSkKLhh98JpBH1Al5HK1irhRA2FMa.F6njL.zSdUcGQ7TnBr5LnwM1mo5TvsUsGRvzf.3IV5EDvNKOfshILCv2RiJ6lzayG_HIBw9; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2FVx2K7wAU4OiqG7y4ZZMZbL0wNYfaWitoPSF35qLPXxmZg3S1npZdG; rl_trait=RudderEncrypt%3AU2FsdGVkX18m4TIpQQyzUu94v2lIo75BGhwwB5rFruadX1ZppuSn4JpIXvjLFNoByR9IUd5ZRxmTjasiKR4d%2FGCYGo4k6Imk3rWFKd8SopSidvUwlO8zT%2F9i3uUwOA7Y%2B%2FW%2FRpJf9JDhM%2BflmKHEIhX0XIQsHjEQWMuXzJpmyHd7yiU9BeDTH7EQZFDf8bt91ZBGVWF4PafQ8bPcbYfZhFwyDdcrUAQ6PDyDiE%2FX7gThbh98XwZjiqd7PXCTpW9br%2F%2Bh9z73vPfI0aJlDBQq85LIvmWpQi7cQTi3U9w7D805olekf5xrSPmMQnB%2BMOLHsrqXZgfMmk2cr1f0IxxS8%2F35CfUk0Vr9zYdchr5H%2B3n339pGSJxDvUz2jWQWa42YKpyrGZ%2F9yhI0DIJjgJpUwwNXrYVbGZRLaDvz63PqNh82p44DNbVucHQqlHYPtSQ0k1kKCSDo%2BNy1D5bCu%2FIyvNBnkuDl8OnVVSTmprFQbo0yPPWsz8usB8g6IfeMMQrMLLmMn%2B3f9dMFtCPxCXnXtw%3D%3D; _hjHasCachedUserAttributes=true; _hjUserAttributesHash=23b89e7743ec6c95de5f8f12214844df; __cf_bm=kRrz9nkTSPXWYQEdACdL_zoUXuPz05ioCn733n29AXI-1745123947-1.0.1.1-y9V6zNafbAbUwewVFNQtSlcunoP_3_tAmDRAro1m7DMBWO.z4oqlifP4_mq2kJWIB0JKnZQsQSccUGQCV7MnQT0aZWOrC4GGZiwQwnYby8w; rl_session=RudderEncrypt%3AU2FsdGVkX1%2F1cOED%2ByW8c26R5Ny2i7te31TxKZVTH0dyCWINzG1ObbE%2FCGA0k1DR7Fl8e6EL9LtS642e3Cm6oi42fXY7QK5BweeQAyQzPBGnniP18VZfFi%2BxM%2F1uO%2F8l5t6LMEysWCB654qvllYItH7bwF93Gmkmx0u1vWQKJqg%3D",
      },
      body: '{"parameters":{"walletAddresses":["0xd387a6e4e84a6c86bd90c158c6028a58cc8ac459"],"chain":"ethereum"},"filters":{},"pagination":{"page":1,"recordsPerPage":5},"order":{"order":"desc"}}',
      method: "POST",
    }
  );

  console.log(response);
};

test();
