import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";
import { nextMitId } from "@/lib/mit-ids";

export async function GET(request: NextRequest) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    let where = "";
    const params: (string | number)[] = [];

    if (search) {
      where = " WHERE m.name LIKE ? OR m.remoteips LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    const sql = "SELECT m.id, m.name, m.password, m.customerpassword, m.locktype, m.calllevel, m.capacity, m.priority, m.registertype, m.remoteips, m.rtpforwardtype, m.gatewaygroups, m.routinggatewaygroups, m.memo, m.customer_id, m.mbx_id, c.name AS customer_name, c.account AS customer_account, c.money AS customer_balance, s.calloutcallerprefixesallow, s.calloutcallerprefixes, s.calloutcalleeprefixesallow, s.calloutcalleeprefixes, s.rewriterulesoutcallee, s.rewriterulesoutcaller, s.callerblacklistpolicy, s.calleeblacklistpolicy, s.calloutroutinggateways, s.sipcodecs, s.h323codecs, s.dtmfreceivemethod, s.dtmfsendmethodsip, s.mediacheckdirection, s.timeoutcallproceeding, s.maxcalldurationlower, s.maxcalldurationupper, s.scheduledcalloutprefixes, s.scheduledrewriterulesout, s.scheduledcapacity, s.callercitye164check, s.calleecitye164check, s.rewriterulesinmobilearea, s.dtmfsendmethodh323, s.dtmfreceivepayloadtype, s.dtmfsendpayloadtypeh323, s.dtmfsendpayloadtypesip, s.q931progressindicator, s.callfailedsipcode, s.callfailedq931causevalue, s.sipresponseaddressmethod, s.siprequestaddressmethod, s.sipremoteringsignal, s.sipcalleee164domain, s.sipcallere164domain, s.h323calleee164domain, s.h323callere164domain, s.allowphonebilling, s.allowbindede164billing, s.enablephonesetting, s.sipauthenticationmethod, s.sipauthenticationuser, s.calltransferbillingmode, s.bitsofh323config, s.bitsofsipconfig, s.bitsofconfig, s.callerallowlength, s.calleeallowlength, s.callerlimite164groups, s.calleelimite164groups, s.minprofitpercent, s.firstroutepolicy, s.secondroutepolicy, s.h323g729sendmode, s.sipg729sendmode, s.sipg729annexb, s.sipg723annexa, s.calleee164restrict, s.timeoutcallredirect, s.maxcallrate, s.maxcallrateunit, s.timeoutredirecte164, s.calculatequality, s.denysamecitycodes, s.checkmobilearea, s.externalrewritetype, s.externalrewritetrigger, s.sipremotepartyidscreen, s.sipe164displayfrom, s.sipextraheader, s.tryprotectroutedelay, s.forwardsignalrewritee164group, s.maxsecondrates, s.lrneatprefixlength, s.lrnfailureaction, s.lrninterstatebillingprefix, s.lrnundeterminedbillingprefix, s.traceendtime, s.aassampling, s.aaswordcategory, s.language, s.rewriteprefixaddoutcallee, s.externalNumberVerifyBits, s.externalNumberVerfiyRewriteCaller, s.externalNumberVerfiyRewriteCallee " +
      "FROM e_gatewaymapping m " +
      "LEFT JOIN e_customer c ON m.customer_id = c.id " +
      "LEFT JOIN e_gatewaymappingsetting s ON m.id = s.gatewaymapping_id " +
      where +
      " ORDER BY m.priority ASC, m.id ASC";

    const rows = await queryVos<any>(sql, params);

    const gateways = (rows as any[]).map((r: any) => ({
      id: r.id,
      name: r.name,
      password: r.password || "",
      customerPassword: r.customerpassword || "",
      lockType: r.locktype,
      callLevel: r.calllevel,
      capacity: r.capacity,
      priority: r.priority,
      registerType: r.registertype,
      remoteIps: r.remoteips,
      rtpForwardType: r.rtpforwardtype,
      gatewayGroups: r.gatewaygroups,
      routingGatewayGroups: r.routinggatewaygroups,
      memo: r.memo,
      customerId: r.customer_id,
      mbxId: r.mbx_id,
      customerName: r.customer_name || null,
      customerAccount: r.customer_account || "",
      customerBalance: Number(r.customer_balance) || 0,
      calloutCallerPrefixesAllow: r.calloutcallerprefixesallow ?? 1,
      calloutCallerPrefixes: r.calloutcallerprefixes || "",
      calloutCalleePrefixesAllow: r.calloutcalleeprefixesallow ?? 1,
      calloutCalleePrefixes: r.calloutcalleeprefixes || "",
      rewriteRulesOutCallee: r.rewriterulesoutcallee || "",
      rewriteRulesOutCaller: r.rewriterulesoutcaller || "",
      callerBlacklistPolicy: r.callerblacklistpolicy ?? 0,
      calleeBlacklistPolicy: r.calleeblacklistpolicy ?? 0,
      calloutRoutingGateways: r.calloutroutinggateways || "",
      sipCodecs: r.sipcodecs || "",
      h323Codecs: r.h323codecs || "",
      dtmfReceiveMethod: r.dtmfreceivemethod ?? 0,
      dtmfSendMethodSip: r.dtmfsendmethodsip ?? 0,
      mediaCheckDirection: r.mediacheckdirection ?? 0,
      timeoutCallProceeding: r.timeoutcallproceeding ?? 30,
      maxCallDurationLower: r.maxcalldurationlower ?? 0,
      maxCallDurationUpper: r.maxcalldurationupper ?? 0,
      scheduledCalloutPrefixes: r.scheduledcalloutprefixes || "",
      scheduledRewriteRulesOut: r.scheduledrewriterulesout || "",
      scheduledCapacity: r.scheduledcapacity || "",
      callerCityE164Check: r.callercitye164check ?? 0,
      calleeCityE164Check: r.calleecitye164check ?? 0,
      rewriteRulesInMobileArea: r.rewriterulesinmobilearea || "",
      dtmfSendMethodH323: r.dtmfsendmethodh323 ?? 0,
      dtmfReceivePayloadType: r.dtmfreceivepayloadtype ?? 0,
      dtmfSendPayloadTypeH323: r.dtmfsendpayloadtypeh323 ?? 0,
      dtmfSendPayloadTypeSip: r.dtmfsendpayloadtypesip ?? 0,
      q931ProgressIndicator: r.q931progressindicator ?? 0,
      callFailedSipCode: r.callfailedsipcode || "",
      callFailedQ931CauseValue: r.callfailedq931causevalue || "",
      sipResponseAddressMethod: r.sipresponseaddressmethod ?? 0,
      sipRequestAddressMethod: r.siprequestaddressmethod ?? 0,
      sipRemoteRingSignal: r.sipremoteringsignal ?? 0,
      sipCalleeE164Domain: r.sipcalleee164domain ?? 0,
      sipCallerE164Domain: r.sipcallere164domain ?? 0,
      h323CalleeE164Domain: r.h323calleee164domain ?? 0,
      h323CallerE164Domain: r.h323callere164domain ?? 0,
      allowPhoneBilling: r.allowphonebilling ?? 0,
      allowBindedE164Billing: r.allowbindede164billing ?? 0,
      enablePhoneSetting: r.enablephonesetting ?? 0,
      sipAuthenticationMethod: r.sipauthenticationmethod ?? 0,
      sipAuthenticationUser: r.sipauthenticationuser || "",
      callTransferBillingMode: r.calltransferbillingmode ?? 0,
      bitsOfH323Config: r.bitsofh323config ?? 0,
      bitsOfSipConfig: r.bitsofsipconfig ?? 0,
      bitsOfConfig: r.bitsofconfig ?? 0,
      callerAllowLength: r.callerallowlength ?? 0,
      calleeAllowLength: r.calleeallowlength ?? 0,
      callerLimitE164Groups: r.callerlimite164groups || "",
      calleeLimitE164Groups: r.calleelimite164groups || "",
      minProfitPercent: r.minprofitpercent ?? 0,
      firstRoutePolicy: r.firstroutepolicy ?? 0,
      secondRoutePolicy: r.secondroutepolicy ?? 0,
      h323G729SendMode: r.h323g729sendmode ?? 0,
      sipG729SendMode: r.sipg729sendmode ?? 0,
      sipG729AnnexB: r.sipg729annexb ?? 0,
      sipG723AnnexA: r.sipg723annexa ?? 0,
      calleeE164Restrict: r.calleee164restrict ?? 0,
      timeoutCallRedirect: r.timeoutcallredirect ?? 0,
      maxCallRate: r.maxcallrate ?? 0,
      maxCallRateUnit: r.maxcallrateunit ?? 0,
      timeoutRedirectE164: r.timeoutredirecte164 || "",
      calculateQuality: r.calculatequality ?? 0,
      denySameCityCodes: r.denysamecitycodes || "",
      checkMobileArea: r.checkmobilearea || "",
      externalRewriteType: r.externalrewritetype ?? 0,
      externalRewriteTrigger: r.externalrewritetrigger || "",
      sipRemotePartyIdScreen: r.sipremotepartyidscreen ?? 0,
      sipE164DisplayFrom: r.sipe164displayfrom ?? 0,
      sipExtraHeader: r.sipextraheader || "",
      tryProtectRouteDelay: r.tryprotectroutedelay ?? 0,
      forwardSignalRewriteE164Group: r.forwardsignalrewritee164group || "",
      maxSecondRates: Number(r.maxsecondrates) || 0,
      lrnEatPrefixLength: r.lrneatprefixlength ?? 0,
      lrnFailureAction: r.lrnfailureaction ?? 0,
      lrnInterstateBillingPrefix: r.lrninterstatebillingprefix || "",
      lrnUndeterminedBillingPrefix: r.lrnundeterminedbillingprefix || "",
      traceEndTime: r.traceendtime ?? 0,
      aasSampling: Number(r.aassampling) || 0,
      aasWordCategory: r.aaswordcategory || "",
      language: r.language || "",
      rewritePrefixAddOutCallee: r.rewriteprefixaddoutcallee || "",
      externalNumberVerifyBits: r.externalNumberVerifyBits ?? 0,
      externalNumberVerifyRewriteCaller: r.externalNumberVerfiyRewriteCaller || "",
      externalNumberVerifyRewriteCallee: r.externalNumberVerfiyRewriteCallee || "",
    }));

    return NextResponse.json({ gateways });
  } catch (e: any) {
    console.error("[mapping GET]", e?.message || e);
    return NextResponse.json({ error: e?.message || "Failed", gateways: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    // Gateway ids are MIT node ids — allocate a globally-unique id.
    const nextId = await nextMitId();

    await executeVos(
      `INSERT INTO e_gatewaymapping (id, name, password, customerpassword, locktype, calllevel, capacity, priority, registertype, remoteips, rtpforwardtype, gatewaygroups, routinggatewaygroups, memo, customer_id, mbx_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        body.name || "",
        body.password || "",
        body.customerPassword || "",
        body.lockType ?? 0,
        body.callLevel ?? 0,
        body.capacity ?? 30,
        body.priority ?? 1,
        body.registerType ?? 0,
        body.remoteIps || "",
        body.rtpForwardType ?? 0,
        body.gatewayGroups || "",
        body.routingGatewayGroups || "",
        body.memo || "",
        body.customerId ?? 0,
        body.mbxId ?? 0,
      ]
    );

    // Create corresponding settings row with all provided fields
    try {
      await executeVos(
        `INSERT INTO e_gatewaymappingsetting (gatewaymapping_id, calloutcallerprefixesallow, calloutcallerprefixes,
          calloutcalleeprefixesallow, calloutcalleeprefixes,
          rewriterulesoutcallee, rewriterulesoutcaller,
          callerblacklistpolicy, calleeblacklistpolicy,
          calloutroutinggateways,
          sipcodecs, h323codecs, dtmfreceivemethod, dtmfsendmethodsip,
          mediacheckdirection, timeoutcallproceeding,
          maxcalldurationlower, maxcalldurationupper,
          scheduledcalloutprefixes, scheduledrewriterulesout, scheduledcapacity,
          callercitye164check,
          calleecitye164check,
          rewriterulesinmobilearea,
          dtmfsendmethodh323,
          dtmfreceivepayloadtype,
          dtmfsendpayloadtypeh323,
          dtmfsendpayloadtypesip,
          q931progressindicator,
          callfailedsipcode,
          callfailedq931causevalue,
          sipresponseaddressmethod,
          siprequestaddressmethod,
          sipremoteringsignal,
          sipcalleee164domain,
          sipcallere164domain,
          h323calleee164domain,
          h323callere164domain,
          allowphonebilling,
          allowbindede164billing,
          enablephonesetting,
          sipauthenticationmethod,
          sipauthenticationuser,
          calltransferbillingmode,
          bitsofh323config,
          bitsofsipconfig,
          bitsofconfig,
          callerallowlength,
          calleeallowlength,
          callerlimite164groups,
          calleelimite164groups,
          minprofitpercent,
          firstroutepolicy,
          secondroutepolicy,
          h323g729sendmode,
          sipg729sendmode,
          sipg729annexb,
          sipg723annexa,
          calleee164restrict,
          timeoutcallredirect,
          maxcallrate,
          maxcallrateunit,
          timeoutredirecte164,
          calculatequality,
          denysamecitycodes,
          checkmobilearea,
          externalrewritetype,
          externalrewritetrigger,
          sipremotepartyidscreen,
          sipe164displayfrom,
          sipextraheader,
          tryprotectroutedelay,
          forwardsignalrewritee164group,
          maxsecondrates,
          lrneatprefixlength,
          lrnfailureaction,
          lrninterstatebillingprefix,
          lrnundeterminedbillingprefix,
          traceendtime,
          aassampling,
          aaswordcategory,
          language,
          rewriteprefixaddoutcallee,
          externalNumberVerifyBits,
          externalNumberVerfiyRewriteCaller,
          externalNumberVerfiyRewriteCallee)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nextId,
          body.calloutCallerPrefixesAllow ?? 1, body.calloutCallerPrefixes || "",
          body.calloutCalleePrefixesAllow ?? 1, body.calloutCalleePrefixes || "",
          body.rewriteRulesOutCallee || "", body.rewriteRulesOutCaller || "",
          body.callerBlacklistPolicy ?? 0, body.calleeBlacklistPolicy ?? 0,
          body.calloutRoutingGateways || "",
          body.sipCodecs || "", body.h323Codecs || "",
          body.dtmfReceiveMethod ?? 0, body.dtmfSendMethodSip ?? 0,
          body.mediaCheckDirection ?? 0, body.timeoutCallProceeding ?? 30,
          body.maxCallDurationLower ?? 0, body.maxCallDurationUpper ?? 0,
          body.scheduledCalloutPrefixes || "", body.scheduledRewriteRulesOut || "",
                    body.scheduledCapacity || "",
          body.callerCityE164Check ?? 0,
          body.calleeCityE164Check ?? 0,
          body.rewriteRulesInMobileArea || "",
          body.dtmfSendMethodH323 ?? 0,
          body.dtmfReceivePayloadType ?? 0,
          body.dtmfSendPayloadTypeH323 ?? 0,
          body.dtmfSendPayloadTypeSip ?? 0,
          body.q931ProgressIndicator ?? 0,
          body.callFailedSipCode || "",
          body.callFailedQ931CauseValue || "",
          body.sipResponseAddressMethod ?? 0,
          body.sipRequestAddressMethod ?? 0,
          body.sipRemoteRingSignal ?? 0,
          body.sipCalleeE164Domain ?? 0,
          body.sipCallerE164Domain ?? 0,
          body.h323CalleeE164Domain ?? 0,
          body.h323CallerE164Domain ?? 0,
          body.allowPhoneBilling ?? 0,
          body.allowBindedE164Billing ?? 0,
          body.enablePhoneSetting ?? 0,
          body.sipAuthenticationMethod ?? 0,
          body.sipAuthenticationUser || "",
          body.callTransferBillingMode ?? 0,
          body.bitsOfH323Config ?? 0,
          body.bitsOfSipConfig ?? 0,
          body.bitsOfConfig ?? 0,
          body.callerAllowLength ?? 0,
          body.calleeAllowLength ?? 0,
          body.callerLimitE164Groups || "",
          body.calleeLimitE164Groups || "",
          body.minProfitPercent ?? 0,
          body.firstRoutePolicy ?? 0,
          body.secondRoutePolicy ?? 0,
          body.h323G729SendMode ?? 0,
          body.sipG729SendMode ?? 0,
          body.sipG729AnnexB ?? 0,
          body.sipG723AnnexA ?? 0,
          body.calleeE164Restrict ?? 0,
          body.timeoutCallRedirect ?? 0,
          body.maxCallRate ?? 0,
          body.maxCallRateUnit ?? 0,
          body.timeoutRedirectE164 || "",
          body.calculateQuality ?? 0,
          body.denySameCityCodes || "",
          body.checkMobileArea || "",
          body.externalRewriteType ?? 0,
          body.externalRewriteTrigger || "",
          body.sipRemotePartyIdScreen ?? 0,
          body.sipE164DisplayFrom ?? 0,
          body.sipExtraHeader || "",
          body.tryProtectRouteDelay ?? 0,
          body.forwardSignalRewriteE164Group || "",
          body.maxSecondRates ?? 0.0,
          body.lrnEatPrefixLength ?? 0,
          body.lrnFailureAction ?? 0,
          body.lrnInterstateBillingPrefix || "",
          body.lrnUndeterminedBillingPrefix || "",
          body.traceEndTime ?? 0,
          body.aasSampling ?? 0.0,
          body.aasWordCategory || "",
          body.language || "",
          body.rewritePrefixAddOutCallee || "",
          body.externalNumberVerifyBits ?? 0,
          body.externalNumberVerifyRewriteCaller || "",
          body.externalNumberVerifyRewriteCallee || "",
        ]
      );
    } catch (settingsErr) {
      // Clean up the gateway if settings can't be created
      try { await executeVos("DELETE FROM e_gatewaymapping WHERE id = ?", [nextId]); } catch {}
      return NextResponse.json({ error: "Gateway created but settings initialization failed — rolled back" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: nextId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create mapping gateway" }, { status: 500 });
  }
}
