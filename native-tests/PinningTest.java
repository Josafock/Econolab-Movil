package com.econolab.security;

import java.io.FileInputStream;
import java.io.IOException;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLHandshakeException;
import javax.net.ssl.SSLPeerUnverifiedException;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;
import okhttp3.CertificatePinner;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.junit.Test;
import static org.junit.Assert.*;

/** Real TLS checks for an ephemeral QA CA and the configured production pins. */
public class PinningTest {
  private static final String QA_HOST = "127.0.0.1";

  private OkHttpClient qaClient(String pin) throws Exception {
    KeyStore roots = KeyStore.getInstance(KeyStore.getDefaultType());
    roots.load(null);
    try (FileInputStream input = new FileInputStream(System.getenv("ECONOLAB_QA_CA_FILE"))) {
      roots.setCertificateEntry("qa-root", CertificateFactory.getInstance("X.509").generateCertificate(input));
    }
    TrustManagerFactory factory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
    factory.init(roots);
    X509TrustManager trust = (X509TrustManager) factory.getTrustManagers()[0];
    SSLContext tls = SSLContext.getInstance("TLS");
    tls.init(null, new javax.net.ssl.TrustManager[] { trust }, null);
    return new OkHttpClient.Builder().sslSocketFactory(tls.getSocketFactory(), trust)
      .certificatePinner(new CertificatePinner.Builder().add(QA_HOST, "sha256/" + pin).build())
      .readTimeout(30, TimeUnit.SECONDS).callTimeout(45, TimeUnit.SECONDS).build();
  }

  private Request qaRequest(String host, int port) {
    return new Request.Builder().url("https://" + host + ":" + port + "/api/privacy/notice").build();
  }

  private OkHttpClient productionClient(String[] pins) {
    CertificatePinner pinner = new CertificatePinner.Builder().add(ProductionPins.HOST, pins).build();
    return new OkHttpClient.Builder().certificatePinner(pinner)
      .connectTimeout(30, TimeUnit.SECONDS)
      .readTimeout(90, TimeUnit.SECONDS)
      .callTimeout(120, TimeUnit.SECONDS).build();
  }

  private Request productionRequest() {
    return new Request.Builder().url("https://" + ProductionPins.HOST + "/api/school/privacy/notice").build();
  }

  @Test public void validQaPinAcceptsTrustedServer() throws Exception {
    try (Response response = qaClient(System.getenv("ECONOLAB_QA_TLS_PIN")).newCall(qaRequest(QA_HOST, 3110)).execute()) {
      assertEquals(200, response.code());
    }
  }

  @Test public void issuerBackupAcceptsASecondCertificateFromTheQaCA() throws Exception {
    try (Response response = qaClient(System.getenv("ECONOLAB_QA_CA_PIN")).newCall(qaRequest(QA_HOST, 3111)).execute()) {
      assertEquals(200, response.code());
    }
  }

  @Test public void wrongQaPinRejectsOtherwiseTrustedServer() throws Exception {
    try (Response ignored = qaClient("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=").newCall(qaRequest(QA_HOST, 3110)).execute()) {
      fail("A wrong QA pin must never allow a connection");
    } catch (SSLPeerUnverifiedException error) {
      assertTrue(error.getMessage().contains("Certificate pinning failure"));
    }
  }

  @Test public void platformTrustDoesNotAcceptThePrivateQaCA() throws Exception {
    OkHttpClient systemTrust = new OkHttpClient.Builder().callTimeout(30, TimeUnit.SECONDS).build();
    try (Response ignored = systemTrust.newCall(qaRequest(QA_HOST, 3110)).execute()) {
      fail("A private QA CA must not be trusted by the public platform store");
    } catch (SSLHandshakeException expected) {
      assertNotNull(expected.getCause());
    }
  }

  @Test public void hostnameVerificationRemainsRequired() throws Exception {
    try (Response ignored = qaClient(System.getenv("ECONOLAB_QA_TLS_PIN")).newCall(qaRequest("127.0.0.2", 3110)).execute()) {
      fail("The certificate has no SAN for 127.0.0.2");
    } catch (SSLPeerUnverifiedException expected) {
      assertTrue(expected.getMessage().contains("Hostname"));
    }
  }

  @Test public void validProductionPinsAcceptRemoteSchoolServer() throws Exception {
    try (Response response = productionClient(ProductionPins.PINS).newCall(productionRequest()).execute()) {
      assertTrue(response.code() >= 200 && response.code() < 500);
    }
  }

  @Test public void productionIssuerBackupAcceptsConfiguredRenewal() throws Exception {
    String[] backup = new String[] { ProductionPins.PINS[1], ProductionPins.PINS[2] };
    try (Response response = productionClient(backup).newCall(productionRequest()).execute()) {
      assertTrue(response.code() >= 200 && response.code() < 500);
    }
  }

  @Test public void wrongProductionPinRejectsRemoteSchoolServer() throws Exception {
    String[] invalid = new String[] { "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" };
    try (Response ignored = productionClient(invalid).newCall(productionRequest()).execute()) {
      fail("A wrong production pin must never allow a connection");
    } catch (IOException error) {
      assertTrue(error instanceof SSLPeerUnverifiedException);
      assertTrue(error.getMessage().contains("Certificate pinning failure"));
    }
  }
}