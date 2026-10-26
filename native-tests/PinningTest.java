package com.econolab.security;

import java.io.FileInputStream;
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

/** Real TLS with an explicit ephemeral QA CA. No TrustAll, hostname override or public API dependency. */
public class PinningTest {
  private static final String HOST = "127.0.0.1";
  private OkHttpClient client(String pin) throws Exception {
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
      .certificatePinner(new CertificatePinner.Builder().add(HOST, "sha256/" + pin).build())
      .readTimeout(30, TimeUnit.SECONDS).callTimeout(45, TimeUnit.SECONDS).build();
  }
  private Request request(String host, int port) {
    return new Request.Builder().url("https://" + host + ":" + port + "/api/privacy/notice").build();
  }
  @Test public void validQaPinAcceptsTrustedServer() throws Exception {
    try (Response response = client(System.getenv("ECONOLAB_QA_TLS_PIN")).newCall(request(HOST, 3110)).execute()) {
      assertEquals(200, response.code());
    }
  }
  @Test public void issuerBackupAcceptsASecondCertificateFromTheQaCA() throws Exception {
    // Port 3111 has a different leaf private key, signed by the same explicit QA CA.
    try (Response response = client(System.getenv("ECONOLAB_QA_CA_PIN")).newCall(request(HOST, 3111)).execute()) {
      assertEquals(200, response.code());
    }
  }
  @Test public void wrongPinRejectsOtherwiseTrustedServer() throws Exception {
    try (Response ignored = client("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=").newCall(request(HOST, 3110)).execute()) {
      fail("A wrong pin must never allow a connection");
    } catch (SSLPeerUnverifiedException error) {
      assertTrue(error.getMessage().contains("Certificate pinning failure"));
    }
  }
  @Test public void platformTrustDoesNotAcceptThePrivateQaCA() throws Exception {
    OkHttpClient systemTrust = new OkHttpClient.Builder().callTimeout(30, TimeUnit.SECONDS).build();
    try (Response ignored = systemTrust.newCall(request(HOST, 3110)).execute()) {
      fail("A private QA CA must not be trusted by the public platform store");
    } catch (SSLHandshakeException expected) {
      assertNotNull(expected.getCause());
    }
  }
  @Test public void hostnameVerificationRemainsRequired() throws Exception {
    try (Response ignored = client(System.getenv("ECONOLAB_QA_TLS_PIN")).newCall(request("127.0.0.2", 3110)).execute()) {
      fail("The certificate has no SAN for 127.0.0.2");
    } catch (SSLPeerUnverifiedException expected) {
      assertTrue(expected.getMessage().contains("Hostname"));
    }
  }
}
