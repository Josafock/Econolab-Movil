package com.econolab.security;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import okhttp3.CertificatePinner;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.junit.Test;
import static org.junit.Assert.*;

/** Real TLS requests, no permissive TrustManager or mocked certificates. */
public class PinningTest {
  private OkHttpClient client(String[] pins) {
    CertificatePinner pinner = new CertificatePinner.Builder().add(ProductionPins.HOST, pins).build();
    return new OkHttpClient.Builder().certificatePinner(pinner)
      .callTimeout(60, TimeUnit.SECONDS).build();
  }
  private Request request() {
    return new Request.Builder().url("https://" + ProductionPins.HOST + "/api/privacy/notice").build();
  }
  @Test public void validPinsAcceptTrustedServer() throws Exception {
    try (Response response = client(ProductionPins.PINS).newCall(request()).execute()) {
      // An older deployment may return 404; TLS must still have succeeded.
      assertTrue(response.code() >= 200 && response.code() < 500);
    }
  }
  @Test public void issuerBackupAcceptsRenewalWithinConfiguredCA() throws Exception {
    String[] backup = new String[] { ProductionPins.PINS[1], ProductionPins.PINS[2] };
    try (Response response = client(backup).newCall(request()).execute()) {
      assertTrue(response.code() >= 200 && response.code() < 500);
    }
  }
  @Test public void wrongPinRejectsOtherwiseTrustedServer() throws Exception {
    String[] invalid = new String[] { "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" };
    try (Response ignored = client(invalid).newCall(request()).execute()) {
      fail("A wrong pin must never allow a connection");
    } catch (IOException error) {
      // A timeout does not prove pin enforcement: require the specific verification failure.
      assertTrue(error instanceof javax.net.ssl.SSLPeerUnverifiedException);
      assertTrue(error.getMessage().contains("Certificate pinning failure"));
    }
  }
}
