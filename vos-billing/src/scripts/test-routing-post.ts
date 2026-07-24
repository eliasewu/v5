#!/usr/bin/env npx tsx
/**
 * End-to-end test: Create a routing gateway with new Additional fields,
 * verify all columns were inserted correctly, then clean up.
 *
 * Usage: npx tsx src/scripts/test-routing-post.ts
 */

import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.VOS_DB_HOST || "127.0.0.1",
  port: parseInt(process.env.VOS_DB_PORT || "3306"),
  user: process.env.VOS_DB_USER || "root",
  password: process.env.VOS_DB_PASSWORD || "",
  database: process.env.VOS_DB_NAME || "vos3000",
};

// Simulates the API POST body with sample values for new Additional fields
const TEST_PAYLOAD = {
  name: "__TEST_VALIDATION_GW__",
  prefix: "999",
  prefixStyle: 0,
  password: "test",
  customerPassword: "testcust",
  lockType: 0,
  callLevel: 0,
  capacity: 50,
  priority: 10,
  ipType: 0,
  encrypt: 0,
  protocol: "0",
  remoteIps: "10.0.0.99",
  rtpForwardType: 1,
  signalPort: 5060,
  signalPortLocal: 5080,
  gatewayGroups: "test-group",
  memo: "E2E test gateway — safe to delete",
  mbxId: 0,
  clearingCustomerId: 0,

  // -- Routing Rules --
  callerPrefixesAllow: 1,
  callerPrefixes: "1,44",
  calleePrefixesAllow: 1,
  calleePrefixes: "1,91",
  forwardingPrefixes: "00",
  callerBlacklistPolicy: 0,
  calleeBlacklistPolicy: 2,
  rewriteRulesInCaller: "test caller rewrite",
  rewriteRulesInCallee: "test callee rewrite",
  denyCallerCallee: "1",

  // -- Period --
  scheduledCapacity: "08:00-18:00=100",
  scheduledPriority: "08:00-18:00=5",
  scheduledCallinPrefixes: "08:00-18:00=1",
  scheduledRewriteRulesIn: "08:00-18:00=test",

  // -- Codec --
  sipCodecs: "g711a;g711u;g729",
  h323Codecs: "g711a;g729",
  timeoutInvite: 30,
  timeoutRinging: 60,

  // -- Additional: Protocol & Signaling --
  localIp: "10.0.0.1",
  sipResponseAddressMethod: 1,
  sipRequestAddressMethod: 2,
  sipExtraHeader: "X-Custom: test",
  sipInviteCode: "180",
  sipAuthenticationUser: "authuser",
  forwardSignalRewriteE164Group: "1",

  // -- Additional: Switch Control --
  stopSwitchAfterUserBusy: 1,
  stopSwitchAfterSdp: 1,
  stopSwitchAfterRtpStart: 0,
  stopSwitchAfterOlc: 1,
  stopSwitchSipCodes: "404,408,503",
  switchUntilConnect: 1,
  enablePhoneDisplay: 1,

  // -- Additional: Timeouts --
  timeoutSetup: 10,
  timeoutCallProceeding: 60,
  timeoutCallProceedingOlc: 30,
  timeoutAlerting: 180,
  timeoutTrying: 15,
  timeoutSessionProgressSdp: 30,
  timeoutSessionProgress: 60,

  // -- Additional: DTMF --
  dtmfReceiveMethod: 1,
  dtmfSendMethodH323: 0,
  dtmfSendMethodSip: 1,
  dtmfReceivePayloadType: 101,
  dtmfSendPayloadTypeH323: 96,
  dtmfSendPayloadTypeSip: 101,

  // -- Additional: Q.931 --
  q931PresentationIndicator: 0,
  q931ScreeningIndicator: 1,
  q931NumberingPlan: 1,
  q931NumberType: 2,

  // -- Additional: SIP Identity --
  sipRemotePartyIdScreen: 1,
  sipE164DisplayType: 0,
  sipPrivacyType: 0,
  sipPPreferredIdentityType: 1,
  sipPAssertedIdentityType: 0,

  // -- Additional: Codec Extras --
  h323G729SendMode: 0,
  sipG729SendMode: 1,
  sipG729AnnexB: 1,
  sipG723AnnexA: 0,

  // -- Additional: E.164 --
  callerCityE164Check: 1,
  calleeCityE164Check: 0,
  calleeE164Restrict: 1,
  clearingAccountUseCalloutE164: 1,
  callerLimitE164Groups: "1,44",
  calleeLimitE164Groups: "1,91",
  rewriteRulesInCallerUseE164Group: "group1",
  rewriteRulesInCallerUseE164Line: 2,

  // -- Additional: Call Control --
  callerAllowLength: 10,
  calleeAllowLength: 15,
  maxCallDurationLower: 0,
  maxCallDurationUpper: 3600,
  maxCallRate: 100,
  maxCallRateUnit: 60,
  mediaCheckDirection: 2,
  enableCallTransfer: 1,
  leastCostRouting: 1,
  bitsOfH323Config: 1,
  bitsOfSipConfig: 2,
  bitsOfConfig: 4,

  // -- Additional: Mobile / Area --
  denySameCityCodes: "1,212",
  checkMobileArea: "1,44",
  rewriteRulesInMobileArea: "test mobile",

  // -- Additional: Quality & Rates --
  calculateQuality: 1,
  feeRateRestrict: 1,
  minProfitPercent: 15,
  maxSecondRates: 0.05,

  // -- Additional: Rewrite --
  rewriteRulesPIdentity: "test p-id",

  // -- Additional: AAS --
  aasSampling: 1.5,
  aasWordCategory: "test-cat",
  traceEndTime: 86400,

  // -- Additional: AXB --
  axbAGroup: "axb-a",
  axbInterface: "axb-if",
  axbAccount: "axb-acct",
  axbBRewriteRules: "axb rewrite",

  // -- Additional: External Number Verify --
  externalNumberVerifyBits: 1,
  externalNumberVerifyRewriteCaller: "verify-caller",
  externalNumberVerifyRewriteCallee: "verify-callee",
};

// Fields to verify after insert (subset of the payload mapped to DB column names)
const VERIFY_FIELDS: { db: string; value: any }[] = [
  { db: "name", value: "__TEST_VALIDATION_GW__" },
  { db: "capacity", value: 50 },
  { db: "priority", value: 10 },
  { db: "remoteips", value: "10.0.0.99" },
  { db: "signalport", value: 5060 },
  { db: "signalportlocal", value: 5080 },
];

const VERIFY_SETTINGS: { db: string; value: any }[] = [
  { db: "localip", value: "10.0.0.1" },
  { db: "stopswitchafteruserbusy", value: 1 },
  { db: "stopswitchaftersdp", value: 1 },
  { db: "stopswitchafterrtpstart", value: 0 },
  { db: "stopswitchsipcodes", value: "404,408,503" },
  { db: "calculatequality", value: 1 },
  { db: "minprofitpercent", value: 15 },
  { db: "maxsecondrates", value: 0.05 },
  { db: "feeraterestrict", value: 1 },
  { db: "dtmfreceivemethod", value: 1 },
  { db: "dtmfsendmethodsip", value: 1 },
  { db: "q931numberingplan", value: 1 },
  { db: "sipauthenticationuser", value: "authuser" },
  { db: "callerallowlength", value: 10 },
  { db: "calleeallowlength", value: 15 },
  { db: "maxcalldurationupper", value: 3600 },
  { db: "sipresponseaddressmethod", value: 1 },
  { db: "callercitye164check", value: 1 },
  { db: "aassampling", value: 1.5 },
  { db: "externalNumberVerifyBits", value: 1 },
];

async function main() {
  console.log("🔌 Connecting to MySQL...");
  const pool = mysql.createPool(DB_CONFIG);

  let testGwId: number | null = null;
  let passed = 0;
  let failed = 0;

  try {
    const [version] = (await pool.execute("SELECT VERSION() as v")) as any;
    console.log(`✅ Connected. MySQL v${version[0].v}\n`);

    // 1. Get next ID
    const [maxRow] = (await pool.execute(
      "SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM e_gatewayrouting"
    )) as any;
    const nextId = Number(maxRow[0]?.next_id || 1);
    testGwId = nextId;
    console.log(`📝 Test gateway ID: ${testGwId}`);

    // 2. INSERT into e_gatewayrouting (exact SQL from route.ts POST)
    console.log("📥 Inserting into e_gatewayrouting...");
    await pool.execute(
      `INSERT INTO e_gatewayrouting (id, name, prefix, prefixstyle, password, customerpassword, locktype, calllevel, capacity, priority, iptype, encrypt, protocol, remoteips, rtpforwardtype, signalport, signalportlocal, gatewaygroups, memo, mbx_id, clearingcustomer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        TEST_PAYLOAD.name || "",
        TEST_PAYLOAD.prefix || "",
        TEST_PAYLOAD.prefixStyle ?? 0,
        TEST_PAYLOAD.password || "",
        TEST_PAYLOAD.customerPassword || "",
        TEST_PAYLOAD.lockType ?? 0,
        TEST_PAYLOAD.callLevel ?? 0,
        TEST_PAYLOAD.capacity ?? 30,
        TEST_PAYLOAD.priority ?? 1,
        TEST_PAYLOAD.ipType ?? 0,
        TEST_PAYLOAD.encrypt ?? 0,
        TEST_PAYLOAD.protocol ?? 0,
        TEST_PAYLOAD.remoteIps || "",
        TEST_PAYLOAD.rtpForwardType ?? 0,
        TEST_PAYLOAD.signalPort ?? 5060,
        TEST_PAYLOAD.signalPortLocal ?? 5060,
        TEST_PAYLOAD.gatewayGroups || "",
        TEST_PAYLOAD.memo || "",
        TEST_PAYLOAD.mbxId ?? 0,
        TEST_PAYLOAD.clearingCustomerId ?? 0,
      ]
    );
    console.log("✅ e_gatewayrouting row inserted");

    // 3. INSERT into e_gatewayroutingsetting (exact SQL from route.ts POST)
    console.log("📥 Inserting into e_gatewayroutingsetting with 97 columns...");
    await pool.execute(
      `INSERT INTO e_gatewayroutingsetting (gatewayrouting_id, callincallerprefixesallow, callincallerprefixes,
        callincalleeprefixesallow, callincalleeprefixes, callinforwardprefixes,
        callerblacklistpolicy, calleeblacklistpolicy,
        rewriterulesincallee, rewriterulesincaller, denycallercallee,
        scheduledcapacity, scheduledpriority, scheduledcallinprefixes, scheduledrewriterulesin,
        sipcodecs, h323codecs, timeoutinvite, timeoutringing,
        callercitye164check, calleecitye164check, stopswitchafterolc, clearingaccountusecalloute164,
        q931presentationindicator, q931screeningindicator, dtmfreceivemethod, dtmfsendmethodh323, dtmfsendmethodsip,
        dtmfreceivepayloadtype, dtmfsendpayloadtypeh323, dtmfsendpayloadtypesip,
        q931numberingplan, q931numbertype, sipresponseaddressmethod, siprequestaddressmethod,
        bitsofh323config, bitsofsipconfig, callerallowlength, calleeallowlength,
        leastcostrouting, h323g729sendmode, sipg729sendmode, sipg729annexb, sipg723annexa,
        mediacheckdirection, enablecalltransfer, maxcalldurationlower, maxcalldurationupper,
        calleee164restrict, enablephonedisplay, switchuntilconnect, maxcallrate, maxcallrateunit,
        sipremotepartyidscreen, sipe164displaytype, sipprivacytype, sipppreferredidentitytype, sippassertedidentitytype,
        rewriterulesincallerusee164line, bitsofconfig, traceendtime, externalNumberVerifyBits, aassampling,
        denysamecitycodes, checkmobilearea, rewriterulesinmobilearea, rewriterulespidentity,
        axbbrewriterules, externalNumberVerfiyRewriteCaller, externalNumberVerfiyRewriteCallee,
        rewriterulesincallerusee164group, callerlimite164groups, calleelimite164groups,
        sipinvitecode, sipauthenticationuser, sipextraheader, forwardsignalrewritee164group,
        aaswordcategory, axbagroup, axbinterface, axbaccount,
        timeoutsetup, timeoutcallproceeding, timeoutcallproceedingolc, timeoutalerting, timeouttrying,
        timeoutsessionprogresssdp, timeoutsessionprogress,
        localip, stopswitchafteruserbusy, stopswitchaftersdp, stopswitchafterrtpstart, stopswitchsipcodes,
        calculatequality, minprofitpercent, maxsecondrates, feeraterestrict)
       VALUES (${Array(97).fill("?").join(", ")})`,
      [
        nextId,
        TEST_PAYLOAD.callerPrefixesAllow ?? 1, TEST_PAYLOAD.callerPrefixes || "",
        TEST_PAYLOAD.calleePrefixesAllow ?? 1, TEST_PAYLOAD.calleePrefixes || "",
        TEST_PAYLOAD.forwardingPrefixes || "",
        TEST_PAYLOAD.callerBlacklistPolicy ?? 0, TEST_PAYLOAD.calleeBlacklistPolicy ?? 0,
        TEST_PAYLOAD.rewriteRulesInCaller || "", TEST_PAYLOAD.rewriteRulesInCallee || "",
        TEST_PAYLOAD.denyCallerCallee || "",
        TEST_PAYLOAD.scheduledCapacity || "", TEST_PAYLOAD.scheduledPriority || "",
        TEST_PAYLOAD.scheduledCallinPrefixes || "", TEST_PAYLOAD.scheduledRewriteRulesIn || "",
        TEST_PAYLOAD.sipCodecs || "", TEST_PAYLOAD.h323Codecs || "",
        TEST_PAYLOAD.timeoutInvite ?? 30, TEST_PAYLOAD.timeoutRinging ?? 60,
        TEST_PAYLOAD.callerCityE164Check ?? 0,
        TEST_PAYLOAD.calleeCityE164Check ?? 0,
        TEST_PAYLOAD.stopSwitchAfterOlc ?? 0,
        TEST_PAYLOAD.clearingAccountUseCalloutE164 ?? 0,
        TEST_PAYLOAD.q931PresentationIndicator ?? 0,
        TEST_PAYLOAD.q931ScreeningIndicator ?? 0,
        TEST_PAYLOAD.dtmfReceiveMethod ?? 0,
        TEST_PAYLOAD.dtmfSendMethodH323 ?? 0,
        TEST_PAYLOAD.dtmfSendMethodSip ?? 0,
        TEST_PAYLOAD.dtmfReceivePayloadType ?? 0,
        TEST_PAYLOAD.dtmfSendPayloadTypeH323 ?? 0,
        TEST_PAYLOAD.dtmfSendPayloadTypeSip ?? 0,
        TEST_PAYLOAD.q931NumberingPlan ?? 0,
        TEST_PAYLOAD.q931NumberType ?? 0,
        TEST_PAYLOAD.sipResponseAddressMethod ?? 0,
        TEST_PAYLOAD.sipRequestAddressMethod ?? 0,
        TEST_PAYLOAD.bitsOfH323Config ?? 0,
        TEST_PAYLOAD.bitsOfSipConfig ?? 0,
        TEST_PAYLOAD.callerAllowLength ?? 0,
        TEST_PAYLOAD.calleeAllowLength ?? 0,
        TEST_PAYLOAD.leastCostRouting ?? 0,
        TEST_PAYLOAD.h323G729SendMode ?? 0,
        TEST_PAYLOAD.sipG729SendMode ?? 0,
        TEST_PAYLOAD.sipG729AnnexB ?? 0,
        TEST_PAYLOAD.sipG723AnnexA ?? 0,
        TEST_PAYLOAD.mediaCheckDirection ?? 0,
        TEST_PAYLOAD.enableCallTransfer ?? 0,
        TEST_PAYLOAD.maxCallDurationLower ?? 0,
        TEST_PAYLOAD.maxCallDurationUpper ?? 0,
        TEST_PAYLOAD.calleeE164Restrict ?? 0,
        TEST_PAYLOAD.enablePhoneDisplay ?? 0,
        TEST_PAYLOAD.switchUntilConnect ?? 0,
        TEST_PAYLOAD.maxCallRate ?? 0,
        TEST_PAYLOAD.maxCallRateUnit ?? 0,
        TEST_PAYLOAD.sipRemotePartyIdScreen ?? 0,
        TEST_PAYLOAD.sipE164DisplayType ?? 0,
        TEST_PAYLOAD.sipPrivacyType ?? 0,
        TEST_PAYLOAD.sipPPreferredIdentityType ?? 0,
        TEST_PAYLOAD.sipPAssertedIdentityType ?? 0,
        TEST_PAYLOAD.rewriteRulesInCallerUseE164Line ?? 0,
        TEST_PAYLOAD.bitsOfConfig ?? 0,
        TEST_PAYLOAD.traceEndTime ?? 0,
        TEST_PAYLOAD.externalNumberVerifyBits ?? 0,
        TEST_PAYLOAD.aasSampling ?? 0.0,
        TEST_PAYLOAD.denySameCityCodes || "",
        TEST_PAYLOAD.checkMobileArea || "",
        TEST_PAYLOAD.rewriteRulesInMobileArea || "",
        TEST_PAYLOAD.rewriteRulesPIdentity || "",
        TEST_PAYLOAD.axbBRewriteRules || "",
        TEST_PAYLOAD.externalNumberVerifyRewriteCaller || "",
        TEST_PAYLOAD.externalNumberVerifyRewriteCallee || "",
        TEST_PAYLOAD.rewriteRulesInCallerUseE164Group || "",
        TEST_PAYLOAD.callerLimitE164Groups || "",
        TEST_PAYLOAD.calleeLimitE164Groups || "",
        TEST_PAYLOAD.sipInviteCode || "",
        TEST_PAYLOAD.sipAuthenticationUser || "",
        TEST_PAYLOAD.sipExtraHeader || "",
        TEST_PAYLOAD.forwardSignalRewriteE164Group || "",
        TEST_PAYLOAD.aasWordCategory || "",
        TEST_PAYLOAD.axbAGroup || "",
        TEST_PAYLOAD.axbInterface || "",
        TEST_PAYLOAD.axbAccount || "",
        TEST_PAYLOAD.timeoutSetup ?? 0,
        TEST_PAYLOAD.timeoutCallProceeding ?? 0,
        TEST_PAYLOAD.timeoutCallProceedingOlc ?? 0,
        TEST_PAYLOAD.timeoutAlerting ?? 0,
        TEST_PAYLOAD.timeoutTrying ?? 0,
        TEST_PAYLOAD.timeoutSessionProgressSdp ?? 0,
        TEST_PAYLOAD.timeoutSessionProgress ?? 0,
        TEST_PAYLOAD.localIp || "",
        TEST_PAYLOAD.stopSwitchAfterUserBusy ?? 0, TEST_PAYLOAD.stopSwitchAfterSdp ?? 0,
        TEST_PAYLOAD.stopSwitchAfterRtpStart ?? 0, TEST_PAYLOAD.stopSwitchSipCodes || "",
        TEST_PAYLOAD.calculateQuality ?? 0, TEST_PAYLOAD.minProfitPercent ?? 0,
        TEST_PAYLOAD.maxSecondRates ?? 0, TEST_PAYLOAD.feeRateRestrict ?? 0,
      ]
    );
    console.log("✅ e_gatewayroutingsetting row inserted with all 97 columns\n");

    // 4. VERIFY: Read back and check values
    console.log("🔍 Verifying inserted values...\n");

    // Verify main table
    const [gwRows] = (await pool.execute(
      "SELECT * FROM e_gatewayrouting WHERE id = ?", [testGwId]
    )) as any;
    const gw = gwRows[0];

    console.log("── e_gatewayrouting ──");
    for (const { db, value } of VERIFY_FIELDS) {
      const actual = gw[db];
      const ok = String(actual) === String(value);
      if (ok) {
        console.log(`  ✅ ${db}: ${actual}`);
        passed++;
      } else {
        console.log(`  ❌ ${db}: expected ${value}, got ${actual}`);
        failed++;
      }
    }

    // Verify settings table
    const [setRows] = (await pool.execute(
      "SELECT * FROM e_gatewayroutingsetting WHERE gatewayrouting_id = ?", [testGwId]
    )) as any;
    const set = setRows[0];

    console.log("\n── e_gatewayroutingsetting ──");
    for (const { db, value } of VERIFY_SETTINGS) {
      const actual = set[db];
      const ok = typeof value === "number"
        ? Number(actual) === value
        : String(actual) === String(value);
      if (ok) {
        console.log(`  ✅ ${db}: ${JSON.stringify(actual)}`);
        passed++;
      } else {
        console.log(`  ❌ ${db}: expected ${JSON.stringify(value)}, got ${JSON.stringify(actual)}`);
        failed++;
      }
    }

    // 5. Clean up
    console.log("\n🧹 Cleaning up test data...");
    await pool.execute("DELETE FROM e_gatewayrouting WHERE id = ?", [testGwId]);
    console.log("✅ Test gateway deleted");

    // 6. Summary
    console.log("\n═══════════════════════════════════");
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    if (failed === 0) {
      console.log("   🎉 ALL CHECKS PASSED!");
      console.log("   POST INSERT with 97 columns works end-to-end.");
    } else {
      console.log("   ⚠️  Some checks failed — see details above.");
    }
    console.log("═══════════════════════════════════");

  } catch (err: any) {
    console.error(`\n❌ FATAL: ${err.message}`);
    if (testGwId) {
      try { await pool.execute("DELETE FROM e_gatewayrouting WHERE id = ?", [testGwId]); } catch {}
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
