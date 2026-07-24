import type { Migration } from "./types";

const migration: Migration = {
  name: "002_routing_settings_columns",
  description: "Add all VOS3000 routing gateway settings columns to e_gatewayroutingsetting",

  async up(db) {
    const intCols = [
      "callercitye164check INT NOT NULL DEFAULT 0",
      "calleecitye164check INT NOT NULL DEFAULT 0",
      "stopswitchafterolc INT NOT NULL DEFAULT 0",
      "clearingaccountusecalloute164 INT NOT NULL DEFAULT 0",
      "q931presentationindicator INT NOT NULL DEFAULT 0",
      "q931screeningindicator INT NOT NULL DEFAULT 0",
      "dtmfreceivemethod INT NOT NULL DEFAULT 0",
      "dtmfsendmethodh323 INT NOT NULL DEFAULT 0",
      "dtmfsendmethodsip INT NOT NULL DEFAULT 0",
      "dtmfreceivepayloadtype INT NOT NULL DEFAULT 0",
      "dtmfsendpayloadtypeh323 INT NOT NULL DEFAULT 0",
      "dtmfsendpayloadtypesip INT NOT NULL DEFAULT 0",
      "q931numberingplan INT NOT NULL DEFAULT 0",
      "q931numbertype INT NOT NULL DEFAULT 0",
      "sipresponseaddressmethod INT NOT NULL DEFAULT 0",
      "siprequestaddressmethod INT NOT NULL DEFAULT 0",
      "bitsofh323config INT NOT NULL DEFAULT 0",
      "bitsofsipconfig INT NOT NULL DEFAULT 0",
      "callerallowlength INT NOT NULL DEFAULT 0",
      "calleeallowlength INT NOT NULL DEFAULT 0",
      "leastcostrouting INT NOT NULL DEFAULT 0",
      "h323g729sendmode INT NOT NULL DEFAULT 0",
      "sipg729sendmode INT NOT NULL DEFAULT 0",
      "sipg729annexb INT NOT NULL DEFAULT 0",
      "sipg723annexa INT NOT NULL DEFAULT 0",
      "mediacheckdirection INT NOT NULL DEFAULT 0",
      "enablecalltransfer INT NOT NULL DEFAULT 0",
      "maxcalldurationlower INT NOT NULL DEFAULT 0",
      "maxcalldurationupper INT NOT NULL DEFAULT 0",
      "calleee164restrict INT NOT NULL DEFAULT 0",
      "enablephonedisplay INT NOT NULL DEFAULT 0",
      "switchuntilconnect INT NOT NULL DEFAULT 0",
      "maxcallrate INT NOT NULL DEFAULT 0",
      "maxcallrateunit INT NOT NULL DEFAULT 0",
      "sipremotepartyidscreen INT NOT NULL DEFAULT 0",
      "sipe164displaytype INT NOT NULL DEFAULT 0",
      "sipprivacytype INT NOT NULL DEFAULT 0",
      "sipppreferredidentitytype INT NOT NULL DEFAULT 0",
      "sippassertedidentitytype INT NOT NULL DEFAULT 0",
      "rewriterulesincallerusee164line INT NOT NULL DEFAULT 0",
      "timeoutsetup INT NOT NULL DEFAULT 0",
      "timeoutcallproceeding INT NOT NULL DEFAULT 0",
      "timeoutcallproceedingolc INT NOT NULL DEFAULT 0",
      "timeoutalerting INT NOT NULL DEFAULT 0",
      "timeouttrying INT NOT NULL DEFAULT 0",
      "timeoutsessionprogresssdp INT NOT NULL DEFAULT 0",
      "timeoutsessionprogress INT NOT NULL DEFAULT 0",
    ];

    const bigintCols = [
      "bitsofconfig BIGINT NOT NULL DEFAULT 0",
      "traceendtime BIGINT NOT NULL DEFAULT 0",
      "externalNumberVerifyBits BIGINT NOT NULL DEFAULT 0",
    ];

    const doubleCols = ["aassampling DOUBLE NOT NULL DEFAULT 0"];

    const textCols = [
      "denysamecitycodes TEXT NOT NULL DEFAULT ''",
      "checkmobilearea TEXT NOT NULL DEFAULT ''",
      "rewriterulesinmobilearea TEXT NOT NULL DEFAULT ''",
      "rewriterulespidentity TEXT NOT NULL DEFAULT ''",
      "axbbrewriterules TEXT NOT NULL DEFAULT ''",
      "externalNumberVerfiyRewriteCaller TEXT NOT NULL DEFAULT ''",
      "externalNumberVerfiyRewriteCallee TEXT NOT NULL DEFAULT ''",
    ];

    const varcharCols = [
      "rewriterulesincallerusee164group VARCHAR(255) NOT NULL DEFAULT ''",
      "callerlimite164groups VARCHAR(255) NOT NULL DEFAULT ''",
      "calleelimite164groups VARCHAR(255) NOT NULL DEFAULT ''",
      "sipinvitecode VARCHAR(255) NOT NULL DEFAULT ''",
      "sipauthenticationuser VARCHAR(255) NOT NULL DEFAULT ''",
      "sipextraheader VARCHAR(255) NOT NULL DEFAULT ''",
      "forwardsignalrewritee164group VARCHAR(255) NOT NULL DEFAULT ''",
      "aaswordcategory VARCHAR(255) NOT NULL DEFAULT ''",
      "axbagroup VARCHAR(255) NOT NULL DEFAULT ''",
      "axbinterface VARCHAR(255) NOT NULL DEFAULT ''",
      "axbaccount VARCHAR(255) NOT NULL DEFAULT ''",
    ];

    const all = [...intCols, ...bigintCols, ...doubleCols, ...textCols, ...varcharCols];

    for (const colDef of all) {
      try {
        await db.execute(`ALTER TABLE e_gatewayroutingsetting ADD COLUMN ${colDef}`);
      } catch (err: any) {
        if (err?.code !== "ER_DUP_FIELDNAME") throw err;
      }
    }
  },

  async down(_db) {
    // Down migration omitted intentionally — dropping columns from
    // the VOS3000 production table could cause data loss.
    console.log("  ⚠️  Down migration skipped: dropping columns from e_gatewayroutingsetting is unsafe");
  },
};

export default migration;
